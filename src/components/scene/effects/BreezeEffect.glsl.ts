/**
 * Breeze — flowing wind. Streamlines of a potential flow around the capsule obstacle:
 * stream function ψ = x(1 − 1/ρ²) and potential φ = y(1 + 1/ρ²) with ρ derived from the
 * pill SDF, so lines hug both sides and flare out at top/bottom. Noise + local swirls
 * deform the field; comet highlights travel along φ; lines draw on during reveal.
 */
export const BREEZE_GLSL = /* glsl */ `
vec2 swirl(vec2 p, vec2 c, float rad, float amt) {
  vec2 d = p - c;
  float k = exp(-dot(d, d) / (rad * rad));
  return c + rot2(amt * k) * d;
}

void breezeFx(inout vec3 col, vec2 q, float t, float r) {
  float d = sdPill(q);
  float dd = max(d, 0.0);
  float aud = 1.0 + uAudio * 0.04;
  col += BREEZE_SEC * exp(-dd / 150.0) * 0.12 * aud * r;
  if (d > 380.0) return;
  vec3 c = vec3(0.0);

  if (dd < 300.0) {
    vec2 p = q;
    vec2 nq = q * 0.0055;
    vec2 wv = vec2(fbm3(nq + vec2(0.0, -t * 0.10)), fbm3(nq + vec2(3.7, -t * 0.08))) - 0.5;
    p += wv * 30.0 * smoothstep(0.0, 50.0, dd);
    // streams peel away from the pill near its top and bottom
    p.x -= sign(p.x) * 46.0 * smoothstep(80.0, 240.0, abs(p.y)) * smoothstep(0.0, 50.0, abs(p.x));
    p = swirl(p, vec2(-78.0, 178.0), 62.0, 1.1 + 0.25 * sin(t * 0.37));
    p = swirl(p, vec2(84.0, 170.0), 58.0, -1.0 - 0.25 * sin(t * 0.29 + 1.0));
    p = swirl(p, vec2(-84.0, -176.0), 60.0, -0.9 - 0.2 * sin(t * 0.33 + 2.0));
    p = swirl(p, vec2(80.0, -182.0), 64.0, 1.0 + 0.2 * sin(t * 0.41 + 0.5));

    float dp = max(sdPill(p), 0.0);
    float rho = 1.0 + dp / 92.0;
    float inv = 1.0 / (rho * rho);
    float psi = p.x * (1.0 - inv);
    float phi = p.y * (1.0 + inv);

    float L = psi / 8.5;
    float fw = max(fwidth(L), 1e-4);
    float id = floor(L + 0.5);
    float f = L - id;
    float h1 = hash11(id * 1.37 + 11.0);
    float h2 = hash11(id * 2.71 + 3.0);
    float h3 = hash11(id * 0.53 + 7.0);
    float present = step(0.28, h1) * step(1.5, abs(id));
    float lw = mix(0.45, 1.6, h2 * h2);
    float lineD = abs(f) / fw;
    float line = exp(-sq(lineD / lw)) * present;

    float flare = smoothstep(60.0, 200.0, abs(q.y));
    float env = exp(-dp / (32.0 + 38.0 * flare)) * smoothstep(0.0, 3.0, dd + 1.0);
    env *= exp(-max(abs(q.y) - 190.0, 0.0) / 60.0);
    float modu = 0.3 + 0.7 * smoothstep(0.25, 0.75, vnoise(vec2(phi * 0.007 + h3 * 13.0 - t * 0.15, id * 0.71)));

    // draw-on during reveal: lines grow from the bottom up, staggered per line
    float u = (phi + 430.0) / 860.0;
    float drawOn = smoothstep(0.0, 0.06, r * 1.3 - u - h3 * 0.25);

    float speed = mix(0.1, 0.55, h3);
    float s = fract(phi / 460.0 - t * speed + h2 * 7.0);
    float dl = mix(0.05, 0.2, h1);
    float hl = s < dl ? pow(s / dl, 2.5) : 0.0;
    hl *= step(0.42, h2);
    float hlLine = exp(-sq(lineD / (lw + 0.9))) * present;

    float rib = exp(-sq((fract(psi / 34.0 + 0.5) - 0.5) * 34.0 / 6.0));

    vec3 lineCol = mix(BREEZE_CORE, BREEZE_HI, 0.35 + 0.65 * h2);
    c += lineCol * line * env * modu * drawOn * 1.35;
    c += BREEZE_CORE * exp(-sq(lineD / (lw * 4.0 + 3.0))) * present * env * modu * drawOn * 0.18;
    c += BREEZE_HI * hl * hlLine * env * drawOn * 2.8;
    c += BREEZE_CORE * rib * env * drawOn * 0.16;
  }

  float flick = 1.0 + 0.04 * sin(t * 1.7) + 0.03 * sin(t * 2.9 + 0.8);
  float inner = mix(1.0, 0.25, (1.0 - smoothstep(-24.0, 0.0, d)));
  c += BREEZE_HI * exp(-dd / 2.4) * 1.15 * flick * inner;
  c += BREEZE_CORE * exp(-dd / 11.0) * 0.55 * flick * inner;
  c += BREEZE_CORE * exp(-dd / 46.0) * 0.26 * aud;

  // a few specks riding the updraft
  float motes = 0.0;
  float count = 6.0 + 10.0 * uQuality;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 3.3 + 0.1);
    float h2 = hash11(fi * 1.7 + 0.9);
    float h3 = hash11(fi * 5.1 + 2.2);
    float prog = fract(t / mix(4.0, 8.0, h1) + h2);
    float side = h3 > 0.5 ? 1.0 : -1.0;
    float y = mix(-230.0, 230.0, prog);
    float x = side * (pillRadius(normalize(vec2(1.0, y / 160.0))) * 0.9 + 18.0 + h1 * 60.0 + 30.0 * smoothstep(120.0, 230.0, abs(y)));
    vec2 dq = q - vec2(x, y);
    motes += exp(-dot(dq, dq) / mix(0.8, 2.6, h2)) * sin(prog * PI);
  }
  c += BREEZE_HI * motes * 1.1;

  col += c * r;
}
`;
