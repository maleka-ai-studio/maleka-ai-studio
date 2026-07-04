// ── Maleka AI Studio · OrbitalRings ───────────────────────────────
// Floating orbital rings around the AI core. Each ring lives in a tilted
// pivot so it spins in its own plane; a glowing node sprite rides each
// ring. Additive, thin, and cheap (a few torus meshes).
// Returns { object3d, update(t, dt) }.

import * as THREE from 'three';
import { softCircle } from './textures.js';

export function createOrbitalRings(opts = {}) {
  const group = new THREE.Group();
  const nodeTex = softCircle();

  const defs = [
    { r: 1.8,  tube: 0.014, color: 0x5ff0ff, op: 0.60, tiltX: 1.45, tiltY: 0.0,  spin: 0.5 },
    { r: 2.35, tube: 0.011, color: 0x3d6bff, op: 0.50, tiltX: 1.25, tiltY: 0.35, spin: -0.34 },
    { r: 2.95, tube: 0.009, color: 0x8257ff, op: 0.40, tiltX: 1.65, tiltY: -0.2, spin: 0.24 },
    { r: 3.6,  tube: 0.007, color: 0xff5d9e, op: 0.26, tiltX: 1.85, tiltY: 0.25, spin: -0.17 },
  ];

  const rings = defs.map((d) => {
    const pivot = new THREE.Group();
    pivot.rotation.x = d.tiltX;
    pivot.rotation.y = d.tiltY;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.tube, 12, 180),
      new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: d.op,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    pivot.add(ring);

    const node = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nodeTex, color: d.color, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    node.scale.setScalar(0.34);
    node.position.set(d.r, 0, 0);
    ring.add(node); // node orbits as the ring spins

    group.add(pivot);
    return { ring, spin: d.spin };
  });

  return {
    object3d: group,
    update(t, dt) {
      const step = dt ?? 0.016;
      rings.forEach((r) => { r.ring.rotation.z += r.spin * step; });
    },
  };
}
