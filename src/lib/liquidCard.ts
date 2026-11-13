/**
 * Spring-driven "liquid" behaviour for a scene card. Everything is written straight to CSS
 * variables on the card (and its floor reflection) from a rAF loop that only runs while
 * something is still moving — no React renders.
 *
 *  --mx/--my   cursor spotlight (fast spring)
 *  --qx/--qy   slow, underdamped "liquid" that sloshes behind the cursor (+ --qa/--qs stretch)
 *  --rx/--ry   tilt toward the pointer, deepened while pressed
 *  --px/--py   magnetic pull toward the pointer
 *  --lx/--ly   content parallax
 *  --sx/--sy   squash & stretch from pointer velocity and the press
 */

interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });

function stepSpring(s: Spring, dt: number) {
  s.v += (s.k * (s.t - s.x) - s.c * s.v) * dt;
  s.x += s.v * dt;
}

const settled = (s: Spring) => Math.abs(s.t - s.x) < 0.0008 && Math.abs(s.v) < 0.002;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface LiquidClasses {
  shell: string;
  flash: string;
  ring: string;
  bloom: string;
}

export interface LiquidCard {
  enter(e: PointerEvent | React.PointerEvent): void;
  move(e: PointerEvent | React.PointerEvent): void;
  leave(): void;
  press(e: PointerEvent | React.PointerEvent): void;
  release(): void;
  flash(e: MouseEvent | React.MouseEvent): void;
  destroy(): void;
}

const isReduced = () =>
  document.documentElement.classList.contains('relax-reduced') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createLiquidCard(el: HTMLElement, mirror: () => HTMLElement | null, cls: LiquidClasses): LiquidCard {
  // cursor (fast) and liquid (slow, wobbly) positions, in 0..1 of the card box
  const x = spring(0.5, 260, 26);
  const y = spring(0.35, 260, 26);
  const qx = spring(0.5, 55, 6.5);
  const qy = spring(0.35, 55, 6.5);
  const hover = spring(0, 150, 13);
  const press = spring(0, 900, 34);

  let raf = 0;
  let last = 0;
  let w = 1;
  let h = 1;
  let down: { x: number; y: number; id: number } | null = null;
  let detachUp: (() => void) | null = null;

  const write = (name: string, value: string) => {
    el.style.setProperty(name, value);
    mirror()?.style.setProperty(name, value);
  };

  function render() {
    const hv = Math.max(0, hover.x);
    const p = press.x;
    write('--mx', `${(x.x * 100).toFixed(2)}%`);
    write('--my', `${(y.x * 100).toFixed(2)}%`);
    write('--qx', `${(qx.x * 100).toFixed(2)}%`);
    write('--qy', `${(qy.x * 100).toFixed(2)}%`);

    // liquid bead stretches along its own velocity
    const qvx = qx.v * w;
    const qvy = qy.v * h;
    const qsp = Math.hypot(qvx, qvy);
    write('--qa', `${Math.atan2(qvy, qvx).toFixed(3)}rad`);
    write('--qs', (1 + Math.min(0.9, qsp * 0.0012)).toFixed(3));

    const depth = 1 + Math.max(0, p) * 1.4;
    write('--rx', `${((0.5 - y.x) * 9 * hv * depth).toFixed(2)}deg`);
    write('--ry', `${((x.x - 0.5) * 11 * hv * depth).toFixed(2)}deg`);
    write('--px', `${((x.x - 0.5) * 10 * hv).toFixed(2)}px`);
    write('--py', `${((y.x - 0.5) * 7 * hv).toFixed(2)}px`);
    write('--lx', `${((qx.x - 0.5) * -6 * hv).toFixed(2)}px`);
    write('--ly', `${((qy.x - 0.5) * -5 * hv).toFixed(2)}px`);

    // jelly: stretch along motion, thin across it; press squashes, release rebounds past 1
    const vx = Math.abs(x.v * w);
    const vy = Math.abs(y.v * h);
    const sX = Math.min(0.035, vx * 0.000022) * hv;
    const sY = Math.min(0.035, vy * 0.000022) * hv;
    const sx = (1 + sX - sY * 0.6) * (1 - 0.035 * p);
    const sy = (1 + sY - sX * 0.6) * (1 - 0.06 * p);
    write('--sx', sx.toFixed(4));
    write('--sy', sy.toFixed(4));
  }

  function frame(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
    last = now;
    // two half-steps keep the stiff press spring stable at low frame rates
    for (let i = 0; i < 2; i++) {
      for (const s of [x, y, qx, qy, hover, press]) stepSpring(s, dt / 2);
    }
    render();
    if ([x, y, qx, qy, hover, press].every(settled)) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (raf || isReduced()) {
      if (isReduced()) render();
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function aim(e: { clientX: number; clientY: number }, snap = false) {
    const r = el.getBoundingClientRect();
    w = r.width || 1;
    h = r.height || 1;
    x.t = clamp((e.clientX - r.left) / w, 0, 1);
    y.t = clamp((e.clientY - r.top) / h, 0, 1);
    qx.t = x.t;
    qy.t = y.t;
    if (snap || isReduced()) {
      for (const [a, b] of [
        [x, qx],
        [y, qy],
      ] as const) {
        a.x = b.x = a.t;
        a.v = b.v = 0;
      }
    }
  }

  function release() {
    down = null;
    detachUp?.();
    detachUp = null;
    if (press.t === 0) return;
    press.t = 0;
    // soft, underdamped rebound → the card wobbles back like jelly
    press.k = 420;
    press.c = 11;
    wake();
  }

  function spawn(root: HTMLElement, fx: number, fy: number) {
    const shell = root.querySelector<HTMLElement>(`.${cls.shell}`);
    const made: HTMLElement[] = [];
    const add = (parent: HTMLElement | null, className: string) => {
      if (!parent) return;
      const s = document.createElement('span');
      s.className = className;
      s.style.setProperty('--fx', `${(fx * 100).toFixed(1)}%`);
      s.style.setProperty('--fy', `${(fy * 100).toFixed(1)}%`);
      s.setAttribute('aria-hidden', 'true');
      parent.appendChild(s);
      made.push(s);
    };
    add(root, cls.bloom);
    add(shell, cls.flash);
    add(shell, cls.ring);
    window.setTimeout(() => made.forEach((s) => s.remove()), 1100);
  }

  return {
    enter(e) {
      const fresh = hover.x < 0.05;
      aim(e, fresh);
      hover.t = 1;
      wake();
    },
    move(e) {
      aim(e);
      if (down && down.id === e.pointerId && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) release();
      wake();
    },
    leave() {
      hover.t = 0;
      release();
      wake();
    },
    press(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      aim(e, hover.x < 0.05);
      if (e.pointerType === 'touch') hover.t = 1;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId };
      press.t = 1;
      press.k = 900;
      press.c = 34;
      // the carousel may capture the pointer for a swipe: always hear the release
      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== down?.id) return;
        if (ev.pointerType === 'touch') hover.t = 0;
        release();
      };
      detachUp?.();
      window.addEventListener('pointerup', up, true);
      window.addEventListener('pointercancel', up, true);
      detachUp = () => {
        window.removeEventListener('pointerup', up, true);
        window.removeEventListener('pointercancel', up, true);
      };
      wake();
    },
    release,
    flash(e) {
      const r = el.getBoundingClientRect();
      // keyboard activation (detail 0) flashes from the centre with a quick tap of the press spring
      const keyboard = e.detail === 0;
      const fx = keyboard ? 0.5 : clamp((e.clientX - r.left) / (r.width || 1), 0, 1);
      const fy = keyboard ? 0.5 : clamp((e.clientY - r.top) / (r.height || 1), 0, 1);
      if (keyboard && !isReduced()) {
        press.v += 14;
        press.k = 420;
        press.c = 11;
        wake();
      }
      // not mirrored: the floor reflection runs with animations off
      spawn(el, fx, fy);
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      detachUp?.();
    },
  };
}
