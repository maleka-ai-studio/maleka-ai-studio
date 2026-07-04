// ── Maleka AI Studio · HeroScene ──────────────────────────────────
// Composes the full cinematic hero: a dramatic opaque backdrop, the
// glowing AI core, orbital rings, a particle vortex, an ambient particle
// field, colored lighting, optional bloom (desktop), plus mouse parallax
// and scroll-linked camera/depth movement.
//
// initHeroScene(mount) returns the ThreeScene instance on success, or
// null when it declines (reduced motion or no WebGL) so the caller keeps
// the CSS orb fallback. It never throws.

import * as THREE from 'three';
import { ThreeScene, isWebGLAvailable } from './ThreeScene.js';
import { createBackdrop } from './Backdrop.js';
import { createMotionBackground } from './MotionBackground.js';
import { createHeroAIOrb } from './HeroAIOrb.js';
import { createOrbitalRings } from './OrbitalRings.js';
import { createVortexField } from './VortexField.js';
import { createParticleField } from './ParticleField.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

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
  const wantsBloom = !isMobile && (navigator.hardwareConcurrency ?? 8) >= 4;

  // opaque cinematic canvas so bloom composites and the backdrop reads
  three.renderer.setClearColor(0x05060e, 1);

  // ── backdrop (behind everything) ──────────────────────────────
  const offsetX = isMobile ? 0 : 2.35;
  const backdrop = createBackdrop({ focusX: 0.5 + offsetX / 40, darkLeft: !isMobile });
  three.scene.add(backdrop.object3d);
  three.updaters.push(backdrop);

  // ── content group (offset toward the right on desktop) ────────
  const root = new THREE.Group();
  root.position.x = offsetX;
  if (isMobile) root.scale.setScalar(0.82);
  three.scene.add(root);

  three.updaters.push(createMotionBackground(three.scene, {}));

  const addToRoot = (comp) => { root.add(comp.object3d); three.updaters.push(comp); return comp; };
  addToRoot(createHeroAIOrb({ detail: isMobile ? 4 : 5 }));
  addToRoot(createOrbitalRings({}));
  addToRoot(createVortexField({ count: isMobile ? 380 : 900 }));
  addToRoot(createParticleField({
    count: isMobile ? 300 : 800,
    size: isMobile ? 0.05 : 0.045,
    inner: 2.6, outer: 9,
  }));

  root.rotation.x = 0.1;

  // ── bloom (desktop only) ──────────────────────────────────────
  let postfx = null;
  const bloomBase = 0.55;
  if (wantsBloom) {
    three.dprCap = 1.5; // bloom is the cost; cap resolution
    three.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    // dynamic import keeps addons out of the critical path if bloom is skipped
    import('./PostFX.js')
      .then(({ createPostFX }) => {
        postfx = createPostFX(three.renderer, three.scene, three.camera, {
          strength: bloomBase, radius: 0.5, threshold: 0.2,
        });
        postfx.setSize(mount.clientWidth, mount.clientHeight);
        three.onResize((w, h) => postfx.setSize(w, h));
        three.setRender(() => postfx.render());
      })
      .catch((e) => console.warn('[HeroScene] bloom unavailable, using base render:', e));
  }

  // ── mouse parallax + scroll-linked motion ─────────────────────
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let px = 0, py = 0, tpx = 0, tpy = 0;
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      const r = mount.getBoundingClientRect();
      tpx = (e.clientX - r.left) / r.width - 0.5;
      tpy = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });
  }

  const heroSection = mount.parentElement || mount;
  let scrollTarget = 0, scrollCur = 0;
  const onScroll = () => {
    const r = heroSection.getBoundingClientRect();
    scrollTarget = clamp(-r.top / (r.height * 0.85), 0, 1);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const baseZ = three.camera.position.z;
  three.onFrame(() => {
    px += (tpx - px) * 0.05;
    py += (tpy - py) * 0.05;
    scrollCur += (scrollTarget - scrollCur) * 0.08;

    // parallax: camera drifts, content group counter-rotates for depth
    three.camera.position.x = px * 1.1;
    three.camera.position.y = -py * 0.7 + scrollCur * 0.6;
    three.camera.position.z = baseZ + scrollCur * 2.4; // dolly out on scroll
    three.camera.lookAt(offsetX * 0.5, 0, 0);

    root.rotation.y = px * 0.35 + scrollCur * 0.6;
    root.rotation.x = 0.1 - py * 0.2;

    // ease bloom down as the hero scrolls away
    if (postfx) postfx.setStrength(bloomBase * (1 - scrollCur * 0.7));
  });

  three.start();
  return three;
}
