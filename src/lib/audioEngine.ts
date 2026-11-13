/**
 * Native Web Audio player: looping AudioBufferSources, per-voice gains for crossfades,
 * a master "transport" gain for pause / session fade, a volume gain, and an analyser
 * for optional, heavily smoothed audio-reactive visuals.
 *
 * It never fakes playback: a missing / undecodable asset throws AudioUnavailableError.
 */
export class AudioUnavailableError extends Error {
  constructor(public src: string, reason: string) {
    super(reason);
    this.name = 'AudioUnavailableError';
  }
}

export class AutoplayBlockedError extends Error {
  constructor() {
    super('Audio was blocked by the browser. Press Play to start.');
    this.name = 'AutoplayBlockedError';
  }
}

interface Voice {
  src: string;
  node: AudioBufferSourceNode;
  gain: GainNode;
}

const CROSSFADE_S = 1.6;
const FADE_IN_S = 1.2;
const PAUSE_FADE_S = 0.35;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private transport!: GainNode;
  private volumeGain!: GainNode;
  private analyser!: AnalyserNode;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private current: Voice | null = null;
  private outgoing: Voice[] = [];
  private token = 0;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private timeData: Float32Array<ArrayBuffer> | null = null;
  private volume = 0.65;
  private muted = false;

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor({ latencyHint: 'playback' });
    this.transport = ctx.createGain();
    this.transport.gain.value = 0;
    this.volumeGain = ctx.createGain();
    this.volumeGain.gain.value = this.effectiveVolume();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.6;
    this.transport.connect(this.volumeGain);
    this.volumeGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.timeData = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
    this.ctx = ctx;
    return ctx;
  }

  private effectiveVolume() {
    // gentle perceptual curve
    return this.muted ? 0 : Math.pow(this.volume, 1.6);
  }

  private load(src: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(src);
    if (cached) return cached;
    const ctx = this.ensure();
    const p = (async () => {
      let res: Response;
      try {
        res = await fetch(src);
      } catch {
        throw new AudioUnavailableError(src, 'Network error while loading audio.');
      }
      if (!res.ok) throw new AudioUnavailableError(src, `No audio asset configured (${res.status}).`);
      const type = res.headers.get('content-type') ?? '';
      if (type.includes('text/html')) throw new AudioUnavailableError(src, 'No audio asset configured.');
      const data = await res.arrayBuffer();
      try {
        return await ctx.decodeAudioData(data);
      } catch {
        throw new AudioUnavailableError(src, 'Audio file could not be decoded.');
      }
    })();
    this.buffers.set(src, p);
    // allow a later retry instead of caching the failure forever
    p.catch(() => this.buffers.delete(src));
    return p;
  }

  private ramp(param: AudioParam, to: number, seconds: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(to, now + Math.max(0.01, seconds));
  }

  private stopVoice(v: Voice, fade: number) {
    const ctx = this.ctx!;
    this.ramp(v.gain.gain, 0, fade);
    try {
      v.node.stop(ctx.currentTime + fade + 0.05);
    } catch {
      /* already stopped */
    }
    v.node.onended = () => {
      v.node.disconnect();
      v.gain.disconnect();
      this.outgoing = this.outgoing.filter((o) => o !== v);
    };
  }

  get hasVoice() {
    return this.current !== null;
  }

  get currentSrc() {
    return this.current?.src ?? null;
  }

  /**
   * Start or resume `src`. If another source is audible it crossfades; if the transport
   * is paused the old voice is dropped and the new one fades in. Superseded calls
   * (rapid scene switching) resolve without touching the graph.
   */
  async play(src: string, opts: { transportUp: boolean }): Promise<'started' | 'superseded'> {
    const ctx = this.ensure();
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch {
        throw new AutoplayBlockedError();
      }
      if ((ctx.state as AudioContextState) !== 'running') throw new AutoplayBlockedError();
    }
    const tok = ++this.token;

    if (this.current && this.current.src === src) {
      this.ramp(this.transport.gain, 1, opts.transportUp ? 0.2 : 0.6);
      return 'started';
    }

    const buffer = await this.load(src);
    if (tok !== this.token) return 'superseded';

    const audible = this.current !== null && this.transport.gain.value > 0.01 && opts.transportUp;
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    node.connect(gain).connect(this.transport);
    node.start();

    if (this.current) {
      // never let more than one voice linger: older fades are cut short
      for (const o of this.outgoing) this.stopVoice(o, 0.15);
      const old = this.current;
      this.outgoing.push(old);
      this.stopVoice(old, audible ? CROSSFADE_S : 0.05);
    }
    this.current = { src, node, gain };
    this.ramp(gain.gain, 1, audible ? CROSSFADE_S : 0.05);
    this.ramp(this.transport.gain, 1, audible ? 0.2 : FADE_IN_S);
    return 'started';
  }

  pause() {
    if (!this.ctx) return;
    this.token++;
    this.ramp(this.transport.gain, 0, PAUSE_FADE_S);
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      void this.ctx?.suspend();
    }, PAUSE_FADE_S * 1000 + 80);
  }

  /** Session complete: long fade, then release the voices. */
  fadeOutAndStop(seconds: number): Promise<void> {
    if (!this.ctx || !this.current) return Promise.resolve();
    this.token++;
    this.ramp(this.transport.gain, 0, seconds);
    return new Promise((resolve) => {
      if (this.pauseTimer) clearTimeout(this.pauseTimer);
      this.pauseTimer = setTimeout(() => {
        this.pauseTimer = null;
        this.stopAll();
        void this.ctx?.suspend();
        resolve();
      }, seconds * 1000 + 60);
    });
  }

  stopAll() {
    if (!this.ctx) return;
    for (const o of this.outgoing) this.stopVoice(o, 0.02);
    if (this.current) this.stopVoice(this.current, 0.02);
    this.current = null;
  }

  setVolume(volume: number, muted: boolean) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.muted = muted;
    if (this.ctx) {
      const p = this.volumeGain.gain;
      p.cancelScheduledValues(this.ctx.currentTime);
      p.setTargetAtTime(this.effectiveVolume(), this.ctx.currentTime, 0.04);
    }
  }

  /** Normalised RMS 0..1 (pre-volume would be nicer, but this is only a gentle modulation). */
  getLevel(): number {
    if (!this.ctx || this.ctx.state !== 'running' || !this.timeData) return 0;
    this.analyser.getFloatTimeDomainData(this.timeData);
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) sum += this.timeData[i] * this.timeData[i];
    const rms = Math.sqrt(sum / this.timeData.length);
    const v = this.effectiveVolume() || 1;
    return Math.min(1, (rms / v) * 3);
  }

  dispose() {
    this.token++;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.stopAll();
    void this.ctx?.close();
    this.ctx = null;
    this.buffers.clear();
  }
}
