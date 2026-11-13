/**
 * Solar — radiant sun. 360° tapered rays seeded per angular cell and launched from the
 * capsule outline (radial distance is measured with the pill SDF, not from a centre point),
 * a 3-tier rim (sharp core / medium / haze) and drifting dust rings.
 */
export const SOLAR_GLSL = /* glsl */ `
float rayLayer(float ang, float dd, float n, float seed, float minL, float maxL,
               float wMin, float wMax, float t, float drift, float grow) {
  float a = (ang + drift * t) / TAU * n;
  float id = mod(floor(a), n);
  float f = fract(a) - 0.5;
  float h1 = hash11(id * 1.731 + seed);
  float h2 = hash11(id * 2.113 + seed * 1.3 + 3.1);
  float h3 = hash11(id * 0.737 + seed * 0.7 + 7.7);
  float c = (h3 - 0.5) * 0.3;
  float L = mix(minL, maxL, h1 * h1) * (1.0 + 0.07 * sin(t * (0.5 + h2 * 1.3) + h1 * TAU)) * grow;
  float x = dd / max(L, 1.0);
  float w = mix(wMin, wMax, h2) * (1.0 - 0.72 * clamp(x, 0.0, 1.0));
  float ad = (f - c) / w;
  float prof = exp(-ad * ad);
  float fall = exp(-x * 2.1) * (1.0 - smoothstep(0.65, 1.0, x));
  float shimmer = 1.0 + 0.06 * sin(t * (0.8 + h3 * 1.6) + h2 * TAU);
  return prof * fall * (0.4 + 0.6 * h2) * shimmer;
}

void solarFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;
  col += SOLAR_SEC * exp(-dd / 170.0) * 0.2 * aud * r;
  if (d > 420.0) return;
  float ang = atan(q.y, q.x);
  float grow = 0.3 + 0.7 * r;

  float soft  = rayLayer(ang, dd, 84.0, 1.0, 45.0, 230.0, 0.10, 0.19, t, 0.010, grow);
  float fine  = rayLayer(ang, dd, 150.0, 5.0, 20.0, 105.0, 0.12, 0.22, t, -0.006, grow);
  float sharp = rayLayer(ang, dd, 26.0, 9.0, 150.0, 330.0, 0.022, 0.045, t, 0.004, grow);

  vec3 rayCol = mix(SOLAR_HI, SOLAR_CORE, smoothstep(0.0, 40.0, dd));
  rayCol = mix(rayCol, SOLAR_SEC, smoothstep(40.0, 200.0, dd));

  vec3 c = rayCol * (soft * 0.95 + fine * 0.55 + sharp * 1.35);

  float flick = 1.0 + 0.045 * sin(t * 2.3) + 0.03 * sin(t * 3.7 + 1.3);
  float inner = mix(1.0, 0.45, (1.0 - smoothstep(-24.0, 0.0, d)));
  c += SOLAR_HI * exp(-dd / 2.4) * 2.3 * flick * inner;
  c += mix(SOLAR_HI, SOLAR_CORE, 0.5) * exp(-dd / 11.0) * 1.05 * flick * inner;
  c += SOLAR_CORE * exp(-dd / 46.0) * 0.42 * aud;

  if (dd < 260.0) {
    float dust = 0.0;
    float count = 10.0 + 18.0 * uQuality;
    for (int i = 0; i < 28; i++) {
      float fi = float(i);
      if (fi >= count) break;
      float h1 = hash11(fi * 3.17 + 1.0);
      float h2 = hash11(fi * 5.31 + 2.0);
      float h3 = hash11(fi * 7.13 + 3.0);
      float h4 = hash11(fi * 1.91 + 4.0);
      float life = mix(7.0, 13.0, h1);
      float prog = fract(t / life + h2);
      float a = h3 * TAU + prog * 0.3 * (h4 - 0.5);
      vec2 dir = vec2(cos(a), sin(a));
      vec2 p = dir * (pillRadius(dir) + 16.0 + prog * mix(80.0, 180.0, h4));
      float size = mix(1.6, 4.2, h1 * h1);
      float dist = length(q - p);
      float m = h2 > 0.42
        ? exp(-sq((dist - size) / 0.8))
        : exp(-sq(dist / (size * 0.5)));
      dust += m * sin(prog * PI) * (0.55 + 0.45 * h3);
    }
    c += SOLAR_HI * dust * 1.3;
  }

  col += c * r;
}
`;
