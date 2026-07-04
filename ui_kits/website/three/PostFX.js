// ── Maleka AI Studio · PostFX ─────────────────────────────────────
// Cinematic bloom via an EffectComposer (RenderPass → UnrealBloomPass →
// OutputPass). Used on capable desktops only; the caller skips it on
// mobile / reduced-motion / low-end and falls back to the in-scene
// additive glow, so bloom is purely a quality upgrade — never required.
//
// Returns { render, setSize, setStrength, dispose, bloom }.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createPostFX(renderer, scene, camera, opts = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    opts.strength ?? 0.85, // intensity
    opts.radius ?? 0.7,    // spread
    opts.threshold ?? 0.12 // only glow the bright, saturated bits
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    bloom,
    render() { composer.render(); },
    setSize(w, h) { composer.setSize(w, h); },
    setStrength(s) { bloom.strength = s; },
    dispose() { composer.dispose?.(); },
  };
}
