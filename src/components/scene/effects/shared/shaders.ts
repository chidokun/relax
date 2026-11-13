import { COMMON_GLSL } from './common.glsl';
import { SOLAR_GLSL } from '../SolarEffect.glsl';
import { EMBER_GLSL } from '../EmberEffect.glsl';
import { BLOOM_GLSL } from '../BloomEffect.glsl';
import { BREEZE_GLSL } from '../BreezeEffect.glsl';
import { NIGHT_GLSL } from '../NightEffect.glsl';
import { RAIN_GLSL } from '../RainEffect.glsl';
import { SCENE_COUNT } from '@/lib/sceneConfig';

export const FULLSCREEN_VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Pass 1 — scene light field (HDR). Background ambient + every scene whose reveal > 0.
 * Only the active scene and the outgoing one (during a crossfade) ever do real work.
 */
export const FX_FRAG = /* glsl */ `
precision highp float;
${COMMON_GLSL}

uniform vec2 uRes;        // stage size in CSS px
uniform float uPx;        // render-target pixels per CSS px
// one entry per scene, in ring order: solar, breeze, bloom, ember, night, rain
uniform float uReveal[${SCENE_COUNT}];
uniform float uAmb[${SCENE_COUNT}];   // ambient tint weights
uniform float uCX[${SCENE_COUNT}];    // per-scene centre x (follows its pill), CSS px
uniform float uCY;
uniform float uStageCX;
uniform float uScale;
uniform float uFloorY;
uniform float uEncode;

${SOLAR_GLSL}
${EMBER_GLSL}
${BLOOM_GLSL}
${BREEZE_GLSL}
${NIGHT_GLSL}
${RAIN_GLSL}

vec3 backdrop(vec2 px) {
  vec3 base = vec3(0.016, 0.016, 0.021);
  vec2 d = (px - vec2(uStageCX, uCY)) / uScale;
  vec2 de = d * vec2(0.82, 1.0);
  float r2 = dot(de, de);
  float g1 = exp(-r2 / (2.0 * 230.0 * 230.0));
  float g2 = exp(-r2 / (2.0 * 520.0 * 520.0));
  vec3 amb = uAmb[0] * SOLAR_AMB + uAmb[1] * BREEZE_AMB + uAmb[2] * BLOOM_AMB + uAmb[3] * EMBER_AMB + uAmb[4] * NIGHT_AMB + uAmb[5] * RAIN_AMB;
  vec3 core = uAmb[0] * SOLAR_SEC + uAmb[1] * BREEZE_SEC + uAmb[2] * BLOOM_SEC + uAmb[3] * EMBER_SEC + uAmb[4] * NIGHT_SEC + uAmb[5] * RAIN_SEC;
  vec3 c = base + amb * g2 * 1.7 + core * g1 * 0.07;
  // faint vertical light column above the stage, like a soft overhead spot
  float column = exp(-sq(d.x / 300.0)) * (1.0 - smoothstep(-200.0, 420.0, d.y));
  c += amb * column * 0.5;
  return c;
}

void main() {
  vec2 px = gl_FragCoord.xy / uPx;
  px.y = uRes.y - px.y;
  vec3 col = backdrop(px);
  float t = uTime;

  if (uReveal[0] > 0.002) solarFx(col, vec2(px.x - uCX[0], uCY - px.y) / uScale, t, uReveal[0]);
  if (uReveal[1] > 0.002) breezeFx(col, vec2(px.x - uCX[1], uCY - px.y) / uScale, t, uReveal[1]);
  if (uReveal[2] > 0.002) bloomFx(col, vec2(px.x - uCX[2], uCY - px.y) / uScale, t, uReveal[2]);
  if (uReveal[3] > 0.002) emberFx(col, vec2(px.x - uCX[3], uCY - px.y) / uScale, t, uReveal[3]);
  if (uReveal[4] > 0.002) nightFx(col, vec2(px.x - uCX[4], uCY - px.y) / uScale, t, uReveal[4]);
  if (uReveal[5] > 0.002) rainFx(col, vec2(px.x - uCX[5], uCY - px.y) / uScale, t, uReveal[5]);

  // soft crop at the viewport edges (never a hard rectangular clip)
  vec2 e = min(px, uRes - px);
  float edge = smoothstep(0.0, 70.0, min(e.x, e.y + 40.0));
  col *= mix(0.35, 1.0, edge);

  gl_FragColor = vec4(max(col, 0.0) * uEncode, 1.0);
}
`;

/** Pass 2 — 9-tap downsample with a soft luminance knee (feeds bloom + floor reflection). */
export const DOWN_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uDstTexel;
uniform float uDecode;
void main() {
  vec2 uv = gl_FragCoord.xy * uDstTexel;
  vec3 c = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      c += texture2D(tSrc, uv + vec2(float(x), float(y)) * uDstTexel * 0.7).rgb;
    }
  }
  c *= uDecode / 9.0;
  float l = max(c.r, max(c.g, c.b));
  c *= smoothstep(0.04, 0.5, l);
  gl_FragColor = vec4(c / uDecode, 1.0);
}
`;

/** Pass 3 — separable gaussian. */
export const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uDstTexel;
uniform vec2 uDir;
void main() {
  vec2 uv = gl_FragCoord.xy * uDstTexel;
  vec3 c = texture2D(tSrc, uv).rgb * 0.227027;
  c += texture2D(tSrc, uv + uDir * 1.0).rgb * 0.1945946;
  c += texture2D(tSrc, uv - uDir * 1.0).rgb * 0.1945946;
  c += texture2D(tSrc, uv + uDir * 2.0).rgb * 0.1216216;
  c += texture2D(tSrc, uv - uDir * 2.0).rgb * 0.1216216;
  c += texture2D(tSrc, uv + uDir * 3.0).rgb * 0.054054;
  c += texture2D(tSrc, uv - uDir * 3.0).rgb * 0.054054;
  c += texture2D(tSrc, uv + uDir * 4.0).rgb * 0.016216;
  c += texture2D(tSrc, uv - uDir * 4.0).rgb * 0.016216;
  gl_FragColor = vec4(c, 1.0);
}
`;

/**
 * Pass 4 — composite: sharp layer + bloom haze, glossy floor (darkened, mirrored and blurred
 * reflection of the light field), horizon line tinted by the active scene, vignette,
 * soft tone-map, dithering and a hint of grain.
 */
export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tFx;
uniform sampler2D tBloom;
uniform sampler2D tHaze;
uniform vec2 uRes;
uniform vec2 uOutPx;
uniform float uFloorY;
uniform float uStageCX;
uniform float uScale;
uniform vec3 uTint;
uniform float uTime;
uniform float uDecode;

float sq(float x) { return x * x; }
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

void main() {
  vec2 uv = gl_FragCoord.xy / uOutPx;
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);

  vec3 sharp = texture2D(tFx, uv).rgb * uDecode;
  vec3 bloom = texture2D(tBloom, uv).rgb * uDecode;
  vec3 haze = texture2D(tHaze, uv).rgb * uDecode;
  vec3 col = sharp + bloom * 0.45 + haze * 0.35;

  float below = px.y - uFloorY;
  if (below > 0.0) {
    float k = below / (150.0 * uScale);
    col *= mix(1.0, 0.28, smoothstep(0.0, 40.0 * uScale, below));
    float my = uFloorY - below;
    vec2 muv = vec2(uv.x, 1.0 - my / uRes.y);
    vec3 rs = texture2D(tFx, muv).rgb * uDecode;
    vec3 rb = texture2D(tBloom, muv).rgb * uDecode;
    vec3 rh = texture2D(tHaze, muv).rgb * uDecode;
    vec3 refl = mix(rs * 0.5 + rb * 0.5, rb * 0.45 + rh * 0.55, clamp(k * 1.2, 0.0, 1.0));
    col += refl * 0.48 * exp(-k * 1.0);
  }

  // horizon / floor line
  float hx = exp(-sq((px.x - uStageCX) / (300.0 * uScale)));
  float dy = (px.y - uFloorY) / uScale;
  float line = exp(-dy * dy / 3.0) * 0.12 + exp(-dy * dy / (18.0 * 18.0)) * 0.07 + exp(-dy * dy / (60.0 * 60.0)) * 0.03;
  col += uTint * line * hx;

  // vignette
  vec2 vv = (uv - 0.5) * vec2(1.0, 1.15);
  col *= mix(0.5, 1.0, 1.0 - smoothstep(0.28, 0.86, length(vv)));

  // soft tone-map: keeps cores hot without hard white clipping
  col = 1.0 - exp(-col * 1.08);

  float n = h21(gl_FragCoord.xy + fract(uTime * 7.13) * 91.7);
  col += (n - 0.5) * (1.6 / 255.0) + (n - 0.5) * 0.012 * smoothstep(0.0, 0.25, col.g);
  gl_FragColor = vec4(col, 1.0);
}
`;
