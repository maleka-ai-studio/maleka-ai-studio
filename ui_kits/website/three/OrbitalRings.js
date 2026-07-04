// ── Maleka AI Studio · OrbitalRings ───────────────────────────────
// Floating orbital rings around the AI core. Each ring lives in a tilted
// pivot so it spins in its own plane. Rings are brighter and thicker for
// a stronger presence under bloom, each paired with a faint wide "glow
// band" and glowing node sprites that orbit with it.
// Returns { object3d, update(t, dt) }.

import * as THREE from 'three';
import { softCircle } from './textures.js';

export function createOrbitalRings(opts = {}) {
  const group = new THREE.Group();
  const nodeTex = softCircle();

  const defs = [
    { r: 2.15, tube: 0.024, color: 0x5ff0ff, op: 0.95, tiltX: 1.45, tiltY: 0.0,  spin: 0.55, nodes: 2 },
    { r: 2.55, tube: 0.018, color: 0x3d6bff, op: 0.85, tiltX: 1.25, tiltY: 0.35, spin: -0.40, nodes: 2 },
    { r: 3.05, tube: 0.016, color: 0x8257ff, op: 0.70, tiltX: 1.65, tiltY: -0.2, spin: 0.30, nodes: 1 },
    { r: 3.6,  tube: 0.013, color: 0x2ad8ee, op: 0.58, tiltX: 1.05, tiltY: 0.5,  spin: -0.24, nodes: 2 },
    { r: 4.2,  tube: 0.011, color: 0xff5d9e, op: 0.44, tiltX: 1.9,  tiltY: 0.25, spin: -0.18, nodes: 1 },
    { r: 4.95, tube: 0.008, color: 0x6f9bff, op: 0.30, tiltX: 1.5,  tiltY: -0.4, spin: 0.13, nodes: 1 },
  ];

  const rings = defs.map((d) => {
    const pivot = new THREE.Group();
    pivot.rotation.x = d.tiltX;
    pivot.rotation.y = d.tiltY;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.tube, 14, 220),
      new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: d.op,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    pivot.add(ring);

    // soft wide glow band hugging the ring
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(d.r, d.tube * 5, 8, 160),
      new THREE.MeshBasicMaterial({
        color: d.color, transparent: true, opacity: d.op * 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    ring.add(band);

    // glowing nodes riding the ring
    for (let n = 0; n < d.nodes; n++) {
      const node = new THREE.Sprite(new THREE.SpriteMaterial({
        map: nodeTex, color: d.color, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      node.scale.setScalar(0.4);
      const a = (n / d.nodes) * Math.PI * 2;
      node.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      ring.add(node);
    }

    group.add(pivot);
    return { ring, spin: d.spin };
  });

  return {
    object3d: group,
    update(t, dt) {
      const step = Math.min(dt ?? 0.016, 0.05);
      rings.forEach((r) => { r.ring.rotation.z += r.spin * step; });
    },
  };
}
