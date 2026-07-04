// ── Maleka AI Studio · HeroScene ──────────────────────────────────
// Composes the full hero 3D scene from the reusable pieces:
//   MotionBackground (lights + beams) · HeroAIOrb · OrbitalRings ·
//   ParticleField — inside a managed ThreeScene, with mouse parallax on
//   the camera.
//
// initHeroScene(mount) returns the ThreeScene instance on success, or
// null when it deliberately declines (reduced motion or no WebGL) so the
// caller can keep the CSS orb as a graceful fallback. It never throws.

import { ThreeScene, isWebGLAvailable } from './ThreeScene.js';
import { createMotionBackground } from './MotionBackground.js';
import { createHeroAIOrb } from './HeroAIOrb.js';
import { createOrbitalRings } from './OrbitalRings.js';
import { createParticleField } from './ParticleField.js';

export function initHeroScene(mount) {
  if (!mount) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (!isWebGLAvailable()) return null;

  let three;
  try {
    three = new ThreeScene(mount, { cameraZ: 6 });
  } catch (e) {
    console.warn('[HeroScene] WebGL init failed, using CSS fallback:', e);
    return null;
  }

  const isMobile = three.isMobile;

  // background lighting + beams, then the core, rings, particles
  three.updaters.push(createMotionBackground(three.scene, {}));
  three.add(createHeroAIOrb({ detail: isMobile ? 4 : 5 }));
  three.add(createOrbitalRings({}));
  three.add(createParticleField({
    count: isMobile ? 450 : 1400,
    size: isMobile ? 0.06 : 0.05,
  }));

  // slight scene tilt to match the hero framing
  three.scene.rotation.x = 0.12;

  // mouse parallax on the camera (fine pointers only)
  let mx = 0, my = 0, tx = 0, ty = 0;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      const r = mount.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
  }
  three.onFrame(() => {
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;
    three.camera.position.x = mx * 0.9;
    three.camera.position.y = -my * 0.55;
    three.camera.lookAt(0, 0, 0);
  });

  three.start();
  return three;
}
