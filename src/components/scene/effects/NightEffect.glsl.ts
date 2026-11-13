/**
 * Night — moonlit stillness. Violet aurora curtains hang above the capsule (fbm-folded bands
 * with a bright, wavering lower hem and fine vertical striations), a thin moon-halo ring
 * hugs the pill outline, a two-depth star field twinkles in one star at a time on reveal,
 * and every so often a faint meteor crosses the upper sky.
 */
export const NIGHT_GLSL = /* glsl */ `
float starLayer(vec2 q, float cell, float seed, float density, float t, float r) {
  vec2 g = q / cell;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h1 = hash21(id + seed);
  if (h1 > density) return 0.0;
  float h2 = hash21(id * 1.37 + seed + 4.1);
  float h3 = hash21(id * 0.71 + seed + 8.3);
  // appear one by one as the scene reveals
  float on = smoothstep(h2 * 0.75, h2 * 0.75 + 0.25, r);
  vec2 p = (vec2(h2, h3) - 0.5) * 0.7;
  float dist = length(f - p) * cell;
  float size = mix(0.7, 1.7, h3 * h3);
  float core = exp(-sq(dist / size));
  float tw = 0.55 + 0.45 * sin(t * mix(0.6, 2.2, h2) + h3 * TAU);
  tw *= 0.75 + 0.25 * sin(t * mix(2.5, 4.0, h1 / density) + h2 * 17.0);
  return core * tw * on * mix(0.45, 1.0, h3);
}

void nightFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.03;

  // cool, wide halo first so the early-out below leaves no edge
  col += NIGHT_SEC * exp(-dd / 190.0) * 0.15 * aud * r;
  if (d > 470.0) return;
  float far = 1.0 - smoothstep(320.0, 470.0, d);

  vec3 c = vec3(0.0);

  // ---- aurora curtains (behind and above the pill) ----
  if (q.y > 40.0) {
    float sx = q.x + (fbm3(vec2(q.x * 0.0035, t * 0.045)) - 0.5) * 140.0;
    float hem = 150.0 + 34.0 * sin(sx * 0.0065 + t * 0.11)
              + 60.0 * (fbm3(vec2(sx * 0.006, t * 0.06 + 3.0)) - 0.5)
              + sq(q.x / 260.0) * 40.0;     // hem droops gently away from the centre
    hem += (1.0 - r) * 120.0;                     // curtains rise into place on reveal
    float h = q.y - hem;
    float height = mix(80.0, 190.0, fbm3(vec2(sx * 0.004 + 9.0, t * 0.03)));
    float vert = smoothstep(-14.0, 10.0, h) * exp(-max(h, 0.0) / height);
    float folds = smoothstep(0.28, 0.72, fbm3(vec2(sx * 0.011, t * 0.07 + 1.7)));
    float stri = vnoise(vec2(sx * 0.05, t * 0.22 + h * 0.004));
    float curtain = vert * folds * (0.55 + 0.45 * stri) * exp(-sq(q.x / 340.0));
    float edgeGlow = exp(-sq(h / 9.0)) * folds * 0.5;

    vec3 ac = mix(NIGHT_HI, NIGHT_CORE, smoothstep(0.0, 36.0, h));
    ac = mix(ac, NIGHT_TOP, smoothstep(50.0, 220.0, h));
    c += (ac * curtain * 1.15 + NIGHT_HI * edgeGlow * 0.4) * far * aud;
  }

  // ---- moon-halo rings around the outline ----
  float breathe = 1.0 + 0.04 * sin(t * 0.45);
  c += mix(NIGHT_HI, NIGHT_CORE, 0.45) * exp(-sq((d - 62.0 * breathe) / 2.6)) * 0.12;
  c += NIGHT_CORE * exp(-sq((d - 70.0 * breathe) / 24.0)) * 0.04;

  // ---- star field, two depths ----
  if (d > 8.0) {
    float s = starLayer(q, 34.0, 1.0, 0.42, t, r) * 1.3
            + starLayer(q + 13.0, 19.0, 7.0, 0.22 + 0.2 * uQuality, t * 1.15, r) * 0.7;
    s *= smoothstep(8.0, 40.0, d) * far;
    c += mix(NIGHT_HI, vec3(1.0), 0.4) * s * 1.6;
  }

  // ---- occasional meteor across the upper sky ----
  float P = 11.0;
  float slot = floor(t / P + 0.37);
  float ph = fract(t / P + 0.37);
  if (ph < 0.09) {
    float k = ph / 0.09;
    float hs = hash11(slot * 3.7 + 1.0);
    vec2 a0 = vec2(mix(-60.0, 300.0, hs), mix(250.0, 360.0, hash11(slot * 5.1 + 2.0)));
    vec2 dir = normalize(vec2(-1.0, -0.42));
    vec2 head = a0 + dir * k * 260.0;
    float tail = 70.0 * sin(k * PI);
    vec2 rel = q - head;
    float along = clamp(dot(rel, -dir), 0.0, tail);
    float dist = length(rel + dir * along);
    float m = exp(-sq(dist / 1.1)) * (1.0 - along / max(tail, 1.0)) * sin(k * PI);
    c += NIGHT_HI * m * 1.4 * r;
  }

  // ---- rim, as on the other scenes ----
  float flick = 1.0 + 0.03 * sin(t * 1.3) + 0.02 * sin(t * 2.6 + 0.8);
  float inner = mix(1.0, 0.4, 1.0 - smoothstep(-24.0, 0.0, d));
  c += NIGHT_HI * exp(-dd / 2.3) * 1.7 * flick * inner;
  c += mix(NIGHT_HI, NIGHT_CORE, 0.5) * exp(-dd / 10.0) * 0.75 * flick * inner;
  c += NIGHT_CORE * exp(-dd / 44.0) * 0.32 * aud;

  col += c * r;
}
`;
