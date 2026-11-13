# AURA — Immersive Ambient Music Player

A single-screen ambient player: a carousel of four soundscapes (Solar, Breeze, Bloom, Ember),
each with its own procedural light scene rendered in WebGL, a glossy floor reflection, and a
quiet player dock (play/pause, scene navigation, session timer, mode, volume, settings).

Built from `AURA_UI_Spec/SPEC.md`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm start          # serves out/ locally
npm run typecheck
```

(`pnpm install && pnpm dev` works the same.)

## Deploy to GitHub Pages

The app is a fully static export (`output: 'export'` in `next.config.ts`), deployed by
`.github/workflows/deploy-pages.yml` on every push to `main` (or manually from the Actions tab).

One-time setup:

1. Push this folder to a GitHub repository, with `main` as the default branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow typechecks, builds and publishes `out/`; the run summary shows
   the site URL (`https://<user>.github.io/<repo>/`).

The base path is detected automatically: `actions/configure-pages` reports `/<repo>` for a
project site (or nothing for a `<user>.github.io` repo) and the build receives it as
`PAGES_BASE_PATH`. To test a project-site build locally:

```bash
PAGES_BASE_PATH=/relax npm run build
```

Audio files in `public/audio/` are published with the site; their URLs get the base path
automatically. Commit only files you have the right to redistribute publicly.

## Audio assets (required for playback)

No music ships with the app. Put licensed, loopable files here:

```
public/audio/solar.mp3
public/audio/breeze.mp3
public/audio/bloom.mp3
public/audio/ember.mp3
```

Paths are configured per scene in `src/lib/sceneConfig.ts` (`audioSrc`). Any format the browser
can decode works (mp3, m4a/aac, ogg, wav). When a file is missing or can't be decoded, the app
shows *"<Scene> audio unavailable"* and stays paused — it never fakes playback.

Playback uses the Web Audio API: looping buffers, a 1.6 s crossfade when the scene changes
while playing, a 4 s fade-out when the session timer ends, and nothing starts without a user
gesture.

## QA helpers

| URL | Effect |
|---|---|
| `/?scene=bloom` | open on a given scene (`solar`, `breeze`, `bloom`, `ember`) |
| `/?quality=static` | force the no-WebGL fallback (SVG artwork) |
| `/?quality=low` / `medium` / `high` | force a renderer tier |

Reference screenshots at 1086×804 (production build): `docs/qa/*.png`.

## Keyboard

`←` `→` previous/next scene · `Space` play/pause · `M` mute · `Esc` close panel.
Space and M only act when focus is on the page itself (never inside a slider, input or dialog);
they can be switched off in Settings.

## How it is built

- **Next.js 16 (App Router) + React 19 + TypeScript**, CSS Modules for layout and tokens.
- **Motion** drives the carousel position (one motion value) and overlay transitions.
- **Three.js** renders the light field: one fullscreen shader for all four scenes, crossfaded
  by per-scene uniforms, followed by bloom/haze blur passes and a composite pass that adds the
  floor reflection, horizon line, vignette, tone-mapping and dithering.
  - Solar — ~260 tapered rays in three layers launched from the capsule outline, 3-tier rim,
    drifting dust rings.
  - Ember — fbm-advected heat field that rises from the top cap, separate tongues, temperature
    colour ramp, buoyant sparks with lifetimes.
  - Bloom — 13 parametric lotus petals (back / mid / base layers) with fresnel fill and bright
    rims, staggered unfolding, out-of-phase sway.
  - Breeze — potential-flow streamlines around the capsule with noise and local swirls; comet
    highlights travel along the stream, lines draw on during reveal.
- Each scene's light follows its own pill during a slide, so the outgoing scene leaves with its
  card while the new one grows in; background tint and reflection crossfade over 1 s.
- Pills are real `<button>`s in the DOM above the canvas, so text stays crisp and accessible.

```
src/
  app/                    layout, page, globals.css
  components/
    ImmersiveApp.tsx      page composition, keyboard, persistence wiring
    scene/
      SceneCarousel.tsx   pills + mirrored floor reflection (CSS vars per frame, no re-renders)
      ScenePill.tsx       capsule card
      SceneEffectRenderer.tsx   mounts the WebGL engine
      StaticSceneArt.tsx  SVG fallback / first paint
      AmbientBackdrop.tsx CSS ambient fallback
      icons/SceneIcons.tsx
      effects/
        FxEngine.ts       renderer, render targets, tweens, adaptive quality, rAF loop
        SolarEffect.glsl.ts  EmberEffect.glsl.ts  BloomEffect.glsl.ts  BreezeEffect.glsl.ts
        shared/common.glsl.ts  shared/shaders.ts
    player/               PlayerDock, Overlay (popover / bottom sheet), Panels, ToastLayer, icons
  hooks/                  useSceneCarousel, useAudioPlayer, useSessionTimer, useStageLayout,
                          useReducedMotion, useAdaptiveQuality, useDockVisibility, usePrefs
  lib/                    sceneConfig, layout, animationTokens, audioEngine, seededRandom
  styles/                 design tokens + CSS modules
  types/scene.ts
```

## Performance and fallbacks

- Shaders compile asynchronously (`KHR_parallel_shader_compile`) while the SVG artwork is shown,
  so the page never freezes; the light field fades in when the first frame is ready.
- Quality tiers (`high` / `medium` / `low`) cap the device pixel ratio and particle counts. The
  starting tier comes from device hints; sustained slow frames step it down. Frames slower than
  120 ms are treated as background throttling and ignored.
- Rendering stops while the tab is hidden; reduced motion freezes the scene and only redraws on
  change.
- Without WebGL2 (or on context loss) the app switches to the static SVG scenes; the carousel and
  player keep working.

## Known limitations

- No audio files are bundled (by design, see above).
- Frame-rate was not measured on real hardware: the embedded test browser throttles
  `requestAnimationFrame`. First shader compile in Chrome took about 3–4 s on the test machine,
  during which the SVG artwork is shown.
- Tested in Chromium at 1086×804, 1440×900, 844×390, 390×844 and 320×568. Safari and physical
  mobile devices still need a pass.
- Mode (Focus / Relax / Sleep) is a session label with a suggested length; the same track plays in
  every mode.
