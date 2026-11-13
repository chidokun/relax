import * as THREE from 'three';
import type { QualityTier, StageLayout } from '@/types/scene';
import { easeInOut, easeOut, easeOutExpo, ringOffset } from '@/lib/animationTokens';
import { SCENE_COUNT } from '@/lib/sceneConfig';
import { BLUR_FRAG, COMPOSITE_FRAG, DOWN_FRAG, FULLSCREEN_VERT, FX_FRAG } from './shared/shaders';

type Ease = (t: number) => number;

interface Tween {
  from: number;
  to: number;
  start: number;
  delay: number;
  dur: number;
  ease: Ease;
}

function tweenValue(tw: Tween, now: number): number {
  const p = (now - tw.start - tw.delay) / tw.dur;
  if (p <= 0) return tw.from;
  if (p >= 1) return tw.to;
  return tw.from + (tw.to - tw.from) * tw.ease(p);
}

function tweenDone(tw: Tween, now: number): boolean {
  return now - tw.start - tw.delay >= tw.dur;
}

const SCENE_TINTS: [number, number, number][] = [
  [1.0, 0.72, 0.25], // solar
  [0.13, 0.85, 0.72], // breeze
  [1.0, 0.35, 0.65], // bloom
  [1.0, 0.32, 0.16], // ember
  [0.6, 0.48, 1.0], // night
  [0.23, 0.48, 1.0], // rain
];

const N = SCENE_COUNT;

const TIER_SETTINGS: Record<Exclude<QualityTier, 'static'>, { dprCap: number; quality: number }> = {
  high: { dprCap: 1.5, quality: 1 },
  medium: { dprCap: 1.15, quality: 0.6 },
  low: { dprCap: 0.85, quality: 0.25 },
};

export interface FxEngineHooks {
  getPos: () => number;
  getAudioLevel: () => number;
  onFirstFrame?: () => void;
  onSlow?: () => void;
  onContextLost?: () => void;
}

/**
 * Owns the WebGL renderer and the four-pass pipeline. Runs on requestAnimationFrame,
 * never touches React state per frame. Scene transitions are uniform tweens, so an
 * interrupted transition simply retargets from its current value.
 */
export class FxEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private fxMat: THREE.ShaderMaterial;
  private downMat: THREE.ShaderMaterial;
  private blurMat: THREE.ShaderMaterial;
  private compMat: THREE.ShaderMaterial;
  private rtFx: THREE.WebGLRenderTarget;
  private rtQ1: THREE.WebGLRenderTarget;
  private rtQ2: THREE.WebGLRenderTarget;
  private rtE1: THREE.WebGLRenderTarget;
  private rtE2: THREE.WebGLRenderTarget;
  private encode = 1;

  private layout: StageLayout | null = null;
  private tier: Exclude<QualityTier, 'static'> = 'high';
  private reducedMotion = false;
  private reveal: Tween[] = [];
  private amb: Tween[] = [];
  private sceneIndex = -1;
  private raf = 0;
  private running = false;
  private t0 = performance.now();
  private frozenTime = 9.0;
  private lastPos = Number.NaN;
  private dirty = true;
  private firstFrameSent = false;
  private audio = 0;
  private lastNow = 0;
  private frameAvg = 16;
  private slowSince = 0;
  private startedAt = performance.now();
  private disposed = false;
  private hasStarted = false;
  private pendingScene = -1;

  constructor(private canvas: HTMLCanvasElement, private hooks: FxEngineHooks) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = false;

    const ext = this.renderer.extensions;
    const floatOk = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float');
    const type = floatOk ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.encode = floatOk ? 1 : 0.25;
    const mk = () =>
      new THREE.WebGLRenderTarget(4, 4, {
        type,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      });
    this.rtFx = mk();
    this.rtQ1 = mk();
    this.rtQ2 = mk();
    this.rtE1 = mk();
    this.rtE2 = mk();

    const decode = 1 / this.encode;
    this.fxMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: FX_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uQuality: { value: 1 },
        uAudio: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uPx: { value: 1 },
        uReveal: { value: new Float32Array(N) },
        uAmb: { value: new Float32Array(N) },
        uCX: { value: new Float32Array(N) },
        uCY: { value: 0 },
        uStageCX: { value: 0 },
        uScale: { value: 1 },
        uFloorY: { value: 0 },
        uEncode: { value: this.encode },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.downMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: DOWN_FRAG,
      uniforms: { tSrc: { value: null }, uDstTexel: { value: new THREE.Vector2() }, uDecode: { value: decode } },
      depthTest: false,
      depthWrite: false,
    });
    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: { tSrc: { value: null }, uDstTexel: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2() } },
      depthTest: false,
      depthWrite: false,
    });
    this.compMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tFx: { value: this.rtFx.texture },
        tBloom: { value: this.rtQ1.texture },
        tHaze: { value: this.rtE1.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uOutPx: { value: new THREE.Vector2(1, 1) },
        uFloorY: { value: 0 },
        uStageCX: { value: 0 },
        uScale: { value: 1 },
        uTint: { value: new THREE.Vector3(1, 0.7, 0.3) },
        uTime: { value: 0 },
        uDecode: { value: decode },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fxMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    for (let i = 0; i < N; i++) {
      const zero = { from: 0, to: 0, start: 0, delay: 0, dur: 1, ease: easeOut };
      this.reveal.push({ ...zero });
      this.amb.push({ ...zero });
    }

    canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  /**
   * Compile every program before the first frame. Uses KHR_parallel_shader_compile
   * (via compileAsync) so the large light-field shader never blocks the main thread;
   * the SVG artwork stays on screen meanwhile.
   */
  async prewarm(): Promise<void> {
    const t0 = performance.now();
    for (const m of [this.fxMat, this.downMat, this.blurMat, this.compMat]) {
      if (this.disposed) return;
      this.quad.material = m;
      await this.renderer.compileAsync(this.scene, this.camera);
    }
    this.quad.material = this.fxMat;
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[Relax] shaders ready in ${Math.round(performance.now() - t0)} ms`);
    }
  }

  setLayout(layout: StageLayout) {
    this.layout = layout;
    this.resize();
    this.dirty = true;
  }

  setTier(tier: QualityTier) {
    if (tier === 'static') return;
    this.tier = tier;
    this.resize();
    this.dirty = true;
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    this.dirty = true;
  }

  /** Retarget reveal/ambient tweens. First call reveals the initial scene as an intro. */
  setScene(index: number) {
    // until the programs are compiled just remember the target: the intro reveal
    // should start when the first frame can actually be shown
    if (!this.hasStarted) {
      this.pendingScene = index;
      return;
    }
    if (index === this.sceneIndex) return;
    const now = performance.now();
    const first = this.sceneIndex === -1;
    this.sceneIndex = index;
    const rm = this.reducedMotion;
    for (let k = 0; k < N; k++) {
      const on = k === index;
      const r = this.reveal[k];
      const cur = tweenValue(r, now);
      if (r.to !== (on ? 1 : 0) || first) {
        this.reveal[k] = on
          ? { from: cur, to: 1, start: now, delay: rm ? 0 : first ? 250 : 140, dur: rm ? 180 : first ? 1400 : 850, ease: easeOutExpo }
          : { from: cur, to: 0, start: now, delay: 0, dur: rm ? 160 : 500, ease: easeOut };
      }
      const a = this.amb[k];
      const ca = tweenValue(a, now);
      if (a.to !== (on ? 1 : 0) || first) {
        this.amb[k] = { from: first ? (on ? 0.4 : 0) : ca, to: on ? 1 : 0, start: now, delay: 0, dur: rm ? 200 : 1000, ease: easeInOut };
      }
    }
    this.dirty = true;
  }

  start() {
    if (this.running || this.disposed) return;
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.startedAt = performance.now();
      if (this.pendingScene >= 0) this.setScene(this.pendingScene);
    }
    this.running = true;
    this.lastNow = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    for (const rt of [this.rtFx, this.rtQ1, this.rtQ2, this.rtE1, this.rtE2]) rt.dispose();
    for (const m of [this.fxMat, this.downMat, this.blurMat, this.compMat]) m.dispose();
    this.quad.geometry.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.hooks.onContextLost?.();
  };

  private handleVisibility = () => {
    if (document.hidden) {
      this.stop();
    } else if (!this.disposed) {
      this.slowSince = 0;
      this.frameAvg = 16;
      this.startedAt = performance.now();
      this.dirty = true;
      this.start();
    }
  };

  private resize() {
    const L = this.layout;
    if (!L) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, TIER_SETTINGS[this.tier].dprCap);
    const w = Math.max(2, Math.round(L.width * dpr));
    const h = Math.max(2, Math.round(L.height * dpr));
    this.renderer.setSize(w, h, false);
    this.rtFx.setSize(w, h);
    const qw = Math.max(2, Math.round(L.width / 4));
    const qh = Math.max(2, Math.round(L.height / 4));
    this.rtQ1.setSize(qw, qh);
    this.rtQ2.setSize(qw, qh);
    const ew = Math.max(2, Math.round(L.width / 10));
    const eh = Math.max(2, Math.round(L.height / 10));
    this.rtE1.setSize(ew, eh);
    this.rtE2.setSize(ew, eh);

    const u = this.fxMat.uniforms;
    (u.uRes.value as THREE.Vector2).set(L.width, L.height);
    u.uPx.value = w / L.width;
    u.uCY.value = L.cy;
    u.uStageCX.value = L.cx;
    u.uScale.value = L.scale;
    u.uFloorY.value = L.floorY;
    u.uQuality.value = TIER_SETTINGS[this.tier].quality;

    const c = this.compMat.uniforms;
    (c.uRes.value as THREE.Vector2).set(L.width, L.height);
    (c.uOutPx.value as THREE.Vector2).set(w, h);
    c.uFloorY.value = L.floorY;
    c.uStageCX.value = L.cx;
    c.uScale.value = L.scale;
  }

  private loop = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);

    const rawMs = now - this.lastNow;
    const dt = Math.min(0.1, rawMs / 1000);
    this.lastNow = now;

    const pos = this.hooks.getPos();
    let animating = false;
    for (let k = 0; k < N; k++) {
      if (!tweenDone(this.reveal[k], now) || !tweenDone(this.amb[k], now)) animating = true;
    }
    if (pos !== this.lastPos) animating = true;
    this.lastPos = pos;

    // Smoothed RMS: lerp(prev, target, 1 - exp(-dt / 0.25))
    const target = this.hooks.getAudioLevel();
    this.audio += (target - this.audio) * (1 - Math.exp(-dt / 0.25));
    if (Math.abs(target - this.audio) > 0.002) animating = true;

    // Reduced motion: frozen time, render only when something actually changes.
    if (this.reducedMotion && !animating && !this.dirty) return;
    this.dirty = false;

    this.render(now, pos);

    if (!this.firstFrameSent) {
      this.firstFrameSent = true;
      this.hooks.onFirstFrame?.();
    }

    // Adaptive quality: sustained slow frames → ask the host to step down a tier.
    // Frames slower than ~120ms are throttling (background window, occluded pane),
    // not GPU load — they must not push the renderer into a lower tier.
    if (!this.reducedMotion && rawMs > 0 && rawMs < 120) {
      this.frameAvg += (rawMs - this.frameAvg) * 0.05;
      if (now - this.startedAt > 3000) {
        if (this.frameAvg > 26) {
          if (!this.slowSince) this.slowSince = now;
          else if (now - this.slowSince > 2500) {
            this.slowSince = 0;
            this.frameAvg = 16;
            this.startedAt = now;
            this.hooks.onSlow?.();
          }
        } else {
          this.slowSince = 0;
        }
      }
    }
  };

  private render(now: number, pos: number) {
    const L = this.layout;
    if (!L) return;
    const t = this.reducedMotion ? this.frozenTime : (now - this.t0) / 1000;

    const u = this.fxMat.uniforms;
    u.uTime.value = t;
    u.uAudio.value = this.audio;
    const r = u.uReveal.value as Float32Array;
    const a = u.uAmb.value as Float32Array;
    const x = u.uCX.value as Float32Array;
    let sum = 0;
    for (let k = 0; k < N; k++) {
      const o = ringOffset(k, pos, N);
      const vis = Math.min(1, Math.max(0, 2 - Math.abs(o) * 1.25));
      r[k] = tweenValue(this.reveal[k], now) * vis;
      a[k] = tweenValue(this.amb[k], now);
      x[k] = L.cx + o * L.gap;
      sum += a[k];
    }
    sum = sum || 1;

    const tint = this.compMat.uniforms.uTint.value as THREE.Vector3;
    tint.set(0, 0, 0);
    for (let k = 0; k < N; k++) {
      tint.x += (SCENE_TINTS[k][0] * a[k]) / sum;
      tint.y += (SCENE_TINTS[k][1] * a[k]) / sum;
      tint.z += (SCENE_TINTS[k][2] * a[k]) / sum;
    }
    this.compMat.uniforms.uTime.value = t;

    const R = this.renderer;
    // 1. light field
    this.quad.material = this.fxMat;
    R.setRenderTarget(this.rtFx);
    R.render(this.scene, this.camera);
    // 2. bloom (quarter res)
    this.pass(this.downMat, this.rtFx, this.rtQ1);
    this.blur(this.rtQ1, this.rtQ2, 1, 0, 1.0);
    this.blur(this.rtQ2, this.rtQ1, 0, 1, 1.0);
    // 3. haze (tenth res, wider kernel)
    this.pass(this.downMat, this.rtQ1, this.rtE1);
    this.blur(this.rtE1, this.rtE2, 1, 0, 1.6);
    this.blur(this.rtE2, this.rtE1, 0, 1, 1.6);
    // 4. composite to screen
    this.quad.material = this.compMat;
    R.setRenderTarget(null);
    R.render(this.scene, this.camera);
  }

  private pass(mat: THREE.ShaderMaterial, src: THREE.WebGLRenderTarget, dst: THREE.WebGLRenderTarget) {
    mat.uniforms.tSrc.value = src.texture;
    (mat.uniforms.uDstTexel.value as THREE.Vector2).set(1 / dst.width, 1 / dst.height);
    this.quad.material = mat;
    this.renderer.setRenderTarget(dst);
    this.renderer.render(this.scene, this.camera);
  }

  private blur(src: THREE.WebGLRenderTarget, dst: THREE.WebGLRenderTarget, dx: number, dy: number, step: number) {
    const m = this.blurMat;
    (m.uniforms.uDir.value as THREE.Vector2).set((dx * step) / src.width, (dy * step) / src.height);
    this.pass(m, src, dst);
  }
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}
