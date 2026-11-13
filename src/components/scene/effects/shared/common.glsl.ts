/**
 * Shared GLSL: hashing, value noise, fbm, capsule SDF and the scene palettes.
 * All scene maths runs in "base units": CSS px at the 1086×804 reference, with the
 * active pill centred at the origin, +y pointing up, half-size 92 × 142.
 */
export const COMMON_GLSL = /* glsl */ `
#define PI 3.14159265359
#define TAU 6.28318530718

uniform float uTime;
uniform float uQuality;
uniform float uAudio;

float sq(float x) { return x * x; }

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 FBM_M = mat2(1.6, 1.2, -1.2, 1.6);

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = FBM_M * p + 17.0; a *= 0.5; }
  return s / 0.96875;
}

float fbm3(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = FBM_M * p + 17.0; a *= 0.5; }
  return s / 0.875;
}

mat2 rot2(float a) { float c = cos(a); float s = sin(a); return mat2(c, s, -s, c); }

/* Vertical capsule = the pill outline (half width 92, straight segment ±50). */
float sdPill(vec2 q) {
  q.y -= clamp(q.y, -50.0, 50.0);
  return length(q) - 92.0;
}

/* Approximate distance from pill centre to its outline along a direction. */
float pillRadius(vec2 dir) {
  return 1.0 / sqrt((dir.x / 92.0) * (dir.x / 92.0) + (dir.y / 142.0) * (dir.y / 142.0));
}

const vec3 SOLAR_AMB  = vec3(0.090, 0.051, 0.016);
const vec3 SOLAR_HI   = vec3(1.000, 0.953, 0.714);
const vec3 SOLAR_CORE = vec3(1.000, 0.800, 0.263);
const vec3 SOLAR_SEC  = vec3(0.914, 0.612, 0.169);

const vec3 BREEZE_AMB  = vec3(0.012, 0.102, 0.086);
const vec3 BREEZE_HI   = vec3(0.710, 1.000, 0.945);
const vec3 BREEZE_CORE = vec3(0.133, 0.851, 0.725);
const vec3 BREEZE_SEC  = vec3(0.055, 0.600, 0.553);

const vec3 BLOOM_AMB  = vec3(0.110, 0.024, 0.090);
const vec3 BLOOM_HI   = vec3(1.000, 0.882, 0.933);
const vec3 BLOOM_CORE = vec3(1.000, 0.345, 0.651);
const vec3 BLOOM_SEC  = vec3(0.863, 0.149, 0.612);

const vec3 EMBER_AMB  = vec3(0.106, 0.020, 0.024);
const vec3 EMBER_HI   = vec3(1.000, 0.941, 0.718);
const vec3 EMBER_CORE = vec3(1.000, 0.420, 0.157);
const vec3 EMBER_SEC  = vec3(0.827, 0.110, 0.133);

const vec3 NIGHT_AMB  = vec3(0.040, 0.026, 0.100);
const vec3 NIGHT_HI   = vec3(0.929, 0.902, 1.000);
const vec3 NIGHT_CORE = vec3(0.612, 0.486, 1.000);
const vec3 NIGHT_SEC  = vec3(0.357, 0.247, 0.839);
const vec3 NIGHT_TOP  = vec3(0.290, 0.330, 0.820);

const vec3 RAIN_AMB  = vec3(0.008, 0.035, 0.110);
const vec3 RAIN_HI   = vec3(0.839, 0.910, 1.000);
const vec3 RAIN_CORE = vec3(0.231, 0.482, 1.000);
const vec3 RAIN_SEC  = vec3(0.086, 0.251, 0.784);
const vec3 RAIN_TOP  = vec3(0.102, 0.173, 0.431);
`;
