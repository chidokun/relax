/**
 * Bloom — luminous lotus. 13 parametric petals (u along axis, width w(u)=sin(πu^.78)^.62,
 * tip curl), alpha-composited back → mid → base, each with fresnel fill, sharp rim and a
 * soft outer glow. Petals unfold in a staggered order on reveal and sway out of phase.
 */
export const BLOOM_GLSL = /* glsl */ `
void petal(inout vec3 acc, vec2 q, vec2 base, float ang, float len, float hw, float bend, float open, float seed) {
  if (open <= 0.001) return;
  vec2 p = q - base;
  vec2 dir = vec2(sin(ang), cos(ang));
  vec2 nrm = vec2(dir.y, -dir.x);
  float u = dot(p, dir) / len;
  if (u <= 0.0 || u >= 1.04) return;
  float uc = clamp(u, 0.0, 1.0);
  float v = dot(p, nrm) - bend * len * uc * uc;
  float w = hw * pow(max(sin(PI * pow(uc, 0.78)), 0.0), 0.62) + 0.001;
  float e = abs(v) / w;
  float ec = min(e, 1.0);
  float edgePx = (1.0 - e) * w;
  float inside = smoothstep(-0.9, 0.9, edgePx) * (1.0 - smoothstep(0.985, 1.0, u));

  vec3 fill = mix(BLOOM_SEC, BLOOM_CORE, smoothstep(0.05, 0.6, uc));
  fill = mix(fill, BLOOM_HI, smoothstep(0.6, 1.0, uc) * 0.3);
  fill = mix(fill, BLOOM_HI, ec * ec * ec * 0.3);
  float vein = exp(-abs(v) / 1.3) * 0.18 * uc + (vnoise(vec2(v * 0.22, uc * 9.0 + seed)) - 0.5) * 0.08;
  vec3 pc = fill * (0.42 + 0.62 * ec * ec + 0.22 * uc) + BLOOM_HI * vein;
  float alpha = inside * (0.62 + 0.25 * ec * ec) * open;
  acc = acc * (1.0 - alpha) + pc * alpha;

  float tipFade = (1.0 - smoothstep(0.9, 1.03, u)) * smoothstep(0.0, 0.12, u);
  float rim = exp(-abs(edgePx) / 1.5);
  float rim2 = exp(-abs(edgePx) / 7.0);
  float outer = exp(-max(-edgePx, 0.0) / 16.0) * step(edgePx, 0.0);
  acc += (BLOOM_HI * rim * 0.9 + BLOOM_CORE * rim2 * 0.2 + BLOOM_CORE * outer * 0.1) * open * tipFade;
}

float unfold(float r, float delay) {
  float x = clamp((r - delay) / (1.0 - delay), 0.0, 1.0);
  return 1.0 - pow(1.0 - x, 3.0);
}

const float P_ANG[13]  = float[13](0.0, -0.21, 0.21, -0.56, 0.56, -0.93, 0.93, -1.22, 1.22, -1.5, 1.5, -1.72, 1.72);
const float P_LEN[13]  = float[13](305.0, 292.0, 292.0, 272.0, 272.0, 248.0, 248.0, 228.0, 228.0, 218.0, 218.0, 192.0, 192.0);
const float P_HW[13]   = float[13](60.0, 58.0, 58.0, 57.0, 57.0, 52.0, 52.0, 47.0, 47.0, 42.0, 42.0, 36.0, 36.0);
const float P_BEND[13] = float[13](0.0, 0.03, 0.03, 0.06, 0.06, 0.09, 0.09, 0.1, 0.1, 0.1, 0.1, 0.12, 0.12);
const float P_BX[13]   = float[13](0.0, 0.0, 0.0, 0.0, 0.0, 6.0, 6.0, 10.0, 10.0, 12.0, 12.0, 16.0, 16.0);
const float P_BY[13]   = float[13](0.0, 0.0, 0.0, 0.0, 0.0, -4.0, -4.0, -10.0, -10.0, -16.0, -16.0, -24.0, -24.0);
const float P_LAYER[13] = float[13](0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 2.0);

void bloomFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.02;

  // broad halo first, so the bounding early-out below never leaves a visible edge
  float hb = length((q - vec2(0.0, -70.0)) * vec2(0.75, 1.0));
  col += BLOOM_SEC * exp(-hb / 170.0) * 0.3 * r;
  if (d > 360.0 || q.y < -260.0) return;

  vec3 acc = col;
  acc += BLOOM_CORE * exp(-dd / 42.0) * 0.28 * r;

  float oBack = unfold(r, 0.32);
  float oMid = unfold(r, 0.16);
  float oBase = unfold(r, 0.0);
  float breathe = 1.0 + 0.018 * sin(t * 0.55) * aud;
  vec2 B = vec2(0.0, -96.0);

  // back → mid → base (front): one loop keeps the program small
  for (int i = 0; i < 13; i++) {
    float fi = float(i);
    float layer = P_LAYER[i];
    float o = layer < 0.5 ? oBack : (layer < 1.5 ? oMid : oBase);
    float sg = P_ANG[i] < 0.0 ? -1.0 : (P_ANG[i] > 0.0 ? 1.0 : 0.0);
    float sway = 0.032 * sin(t * (0.59 + 0.047 * fi) + fi * 1.93);
    float a = P_ANG[i] * mix(layer > 1.5 ? 0.25 : 0.2, 1.0, o) + sway;
    vec2 base = B + vec2(sg * P_BX[i], P_BY[i]);
    petal(acc, q, base, a, P_LEN[i] * mix(0.6, 1.0, o) * breathe, P_HW[i], -sg * P_BEND[i], o, fi + 1.0);
  }

  // the card hides the petal roots; keep them out of the light field so they
  // don't bloom into a white blob around the pill's base
  float underCard = 1.0 - smoothstep(-14.0, 0.0, d);
  acc = mix(acc, col + BLOOM_CORE * 0.18 * r, underCard * 0.9);

  vec3 c = vec3(0.0);
  float flick = 1.0 + 0.04 * sin(t * 1.9) + 0.025 * sin(t * 3.1 + 2.0);
  float inner = mix(1.0, 0.15, 1.0 - smoothstep(-24.0, 0.0, d));
  c += BLOOM_HI * exp(-dd / 2.3) * 1.4 * flick * inner;
  c += mix(BLOOM_HI, BLOOM_CORE, 0.5) * exp(-dd / 10.0) * 0.55 * flick * inner;
  c += mix(BLOOM_CORE, BLOOM_HI, 0.3) * exp(-length((q - vec2(0.0, -130.0)) * vec2(0.55, 1.0)) / 50.0) * 0.28;

  // floating motes above the lotus
  float motes = 0.0;
  float count = 8.0 + 12.0 * uQuality;
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 2.91 + 0.7);
    float h2 = hash11(fi * 4.37 + 1.1);
    float h3 = hash11(fi * 1.29 + 2.3);
    float life = mix(6.0, 11.0, h1);
    float prog = fract(t / life + h2);
    vec2 p = vec2((h3 - 0.5) * 420.0 + sin(prog * TAU + h1 * 6.0) * 14.0, -40.0 + prog * mix(160.0, 260.0, h2));
    float m = exp(-dot(q - p, q - p) / mix(1.2, 4.0, h1));
    motes += m * sin(prog * PI);
  }
  c += BLOOM_HI * motes * 1.2;

  col = mix(col, acc, r) + c * r;
}
`;
