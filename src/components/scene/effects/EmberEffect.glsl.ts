/**
 * Ember — living flame. An fbm-advected heat field wrapped around the top of the capsule
 * (reach grows with height, tongues broken by a faster noise), temperature colour ramp,
 * a warm rim, and buoyant sparks with lifetime fade.
 */
export const EMBER_GLSL = /* glsl */ `
vec3 fireRamp(float h) {
  vec3 c = mix(vec3(0.0), vec3(0.5, 0.02, 0.05), smoothstep(0.0, 0.15, h));
  c = mix(c, vec3(0.95, 0.12, 0.06), smoothstep(0.1, 0.38, h));
  c = mix(c, vec3(1.0, 0.4, 0.08), smoothstep(0.35, 0.65, h));
  c = mix(c, vec3(1.0, 0.75, 0.32), smoothstep(0.62, 0.88, h));
  c = mix(c, vec3(1.0, 0.95, 0.78), smoothstep(0.88, 1.0, h));
  return c;
}

void emberFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.05;
  col += EMBER_SEC * exp(-dd / 150.0) * 0.09 * aud * r;
  if (d > 430.0) return;
  vec3 c = vec3(0.0);

  // ---- flame field: rises from the top cap, sideways reach is expensive ----
  if (q.y > -70.0 && abs(q.x) < 220.0 && q.y < 420.0) {
    vec2 fq = vec2(q.x * 0.016, q.y * 0.0105 - t * 1.1);
    float n1 = fbm(fq);
    float n2 = fbm(fq * 2.1 + vec2(5.2, -t * 0.65));
    float hgt = clamp((q.y - 40.0) / 220.0, 0.0, 1.0);
    vec2 qd = q + vec2((n1 - 0.5) * 70.0 * hgt, 0.0);
    float ax = abs(qd.x);
    float capY = 50.0 + sqrt(max(92.0 * 92.0 - ax * ax, 0.0));
    float dx = max(ax - 92.0, 0.0);
    float dy = ax < 92.0 ? max(qd.y - capY, 0.0) : max(qd.y - 50.0, 0.0);
    float dist = length(vec2(dx * 2.1, dy));
    float top = smoothstep(-40.0, 130.0, q.y);
    float reach = mix(9.0, 150.0, top * top) * (1.0 - 0.3 * smoothstep(20.0, 120.0, abs(q.x)));
    reach *= mix(0.6, 1.3, n2) * (0.25 + 0.75 * r) * aud;
    float base = 1.0 - dist / reach;
    // vertical streaks of turbulence carve separate tongues out of the body
    float tong = fbm(vec2(q.x * 0.03 + n1 * 1.3, q.y * 0.015 - t * 2.1));
    float tong2 = vnoise(vec2(q.x * 0.085, q.y * 0.035 - t * 3.8));
    float f = base * 1.1 - 0.12 + (tong - 0.5) * 1.05 + (tong2 - 0.5) * 0.25;
    float body = smoothstep(0.0, 0.28, f);
    float temp = clamp(f, 0.0, 1.0);
    c += fireRamp(temp) * body * (0.35 + 1.25 * temp * temp);
  }

  // ---- rim + glows ----
  float upper = 0.5 + 0.5 * smoothstep(-90.0, 120.0, q.y);
  float inner = mix(1.0, 0.2, 1.0 - smoothstep(-24.0, 0.0, d));
  float flick = 1.0 + 0.06 * sin(t * 3.1) + 0.04 * sin(t * 5.3 + 0.7);
  c += EMBER_HI * exp(-dd / 2.2) * 0.95 * upper * flick * inner;
  c += EMBER_CORE * exp(-dd / 10.0) * 0.55 * flick * inner;
  c += EMBER_SEC * exp(-dd / 46.0) * 0.3;
  c += vec3(1.0, 0.72, 0.32) * exp(-length((q - vec2(0.0, 150.0)) * vec2(0.8, 1.2)) / 34.0) * 0.6 * r;

  // ---- sparks ----
  if (abs(q.x) < 260.0 && q.y > 40.0) {
    vec3 sparkCol = vec3(0.0);
    float count = 18.0 + 36.0 * uQuality;
    for (int i = 0; i < 54; i++) {
      float fi = float(i);
      if (fi >= count) break;
      float h1 = hash11(fi * 3.71 + 0.3);
      float h2 = hash11(fi * 1.33 + 1.7);
      float life = mix(0.9, 3.0, h1);
      float tt = t / life + h2;
      float cycle = floor(tt);
      float age = fract(tt);
      float h3 = hash11(fi * 2.17 + cycle * 13.1);
      float h4 = hash11(fi * 4.03 + cycle * 7.7);
      float h5 = hash11(fi * 0.91 + cycle * 3.3);
      float x0 = (h3 - 0.5) * 190.0;
      float y0 = 115.0 + h4 * 45.0;
      float rise = mix(150.0, 330.0, h2);
      vec2 p = vec2(
        x0 + sin(age * 5.0 + h1 * TAU) * 11.0 + age * age * mix(-55.0, 55.0, h4),
        y0 + age * rise - age * age * 30.0
      );
      float size = h5 > 0.93 ? 3.2 : mix(0.8, 2.0, h5);
      size *= 1.0 - 0.4 * age;
      float fade = pow(1.0 - age, 1.6) * smoothstep(0.0, 0.06, age);
      vec2 dq = q - p;
      float m = exp(-dot(dq, dq) / (size * size)) * fade;
      sparkCol += m * mix(vec3(1.0, 0.9, 0.55), vec3(1.0, 0.35, 0.08), age);
    }
    c += sparkCol * 2.2;
  }

  col += c * r;
}
`;
