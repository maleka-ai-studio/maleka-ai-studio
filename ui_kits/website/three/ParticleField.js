// ── Maleka AI Studio · ParticleField ──────────────────────────────
// Floating particle cloud shelled around the AI core. A single
// THREE.Points draw call with per-vertex brand colors (cyan / blue /
// violet / pink). Particle count is passed in so the caller can scale it
// down on mobile. Returns { object3d, update(t) }.

import * as THREE from 'three';
import { softCircle } from './textures.js';

export function createParticleField(opts = {}) {
  const count = opts.count ?? 1200;
  const inner = opts.inner ?? 2.2;
  const outer = opts.outer ?? 8;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0x5ff0ff),
    new THREE.Color(0x6f9bff),
    new THREE.Color(0xa98bff),
    new THREE.Color(0xff8fc0),
  ];
  const rand = (a, b) => a + Math.random() * (b - a);

  for (let i = 0; i < count; i++) {
    const r = rand(inner, outer);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(rand(-1, 1));
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.72; // flatten toward the ecliptic
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: opts.size ?? 0.05,
    map: softCircle(),
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);

  return {
    object3d: points,
    update(t) {
      points.rotation.y = t * 0.03;
      points.rotation.x = Math.sin(t * 0.05) * 0.1;
      mat.opacity = 0.72 + Math.sin(t * 0.8) * 0.16;
    },
  };
}
