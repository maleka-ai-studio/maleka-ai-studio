// ── Maleka AI Studio · VortexField ────────────────────────────────
// Particle vortex / black-hole accretion disk. Particles orbit the core
// and slowly spiral inward, respawning at the outer rim — a swirling
// inflow that reads as energy being drawn into the AI core. CPU-updated
// positions (cheap at these counts), one additive Points draw call,
// tilted into a disk. Returns { object3d, update(t, dt) }.

import * as THREE from 'three';
import { softCircle } from './textures.js';

export function createVortexField(opts = {}) {
  const count = opts.count ?? 900;
  const rIn = opts.inner ?? 1.35;
  const rOut = opts.outer ?? 5.2;
  const rand = (a, b) => a + Math.random() * (b - a);

  const palette = [
    new THREE.Color(0x5ff0ff), // cyan
    new THREE.Color(0x6f9bff), // blue
    new THREE.Color(0xa98bff), // violet
    new THREE.Color(0xff8fc0), // pink
  ];

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  // per-particle polar state
  const ang = new Float32Array(count);
  const rad = new Float32Array(count);
  const spd = new Float32Array(count);
  const inflow = new Float32Array(count);
  const zoff = new Float32Array(count);

  function seed(i, atRim) {
    ang[i] = Math.random() * Math.PI * 2;
    rad[i] = atRim ? rOut : rand(rIn, rOut);
    spd[i] = rand(0.35, 0.9);
    inflow[i] = rand(0.12, 0.4);
    zoff[i] = rand(-0.35, 0.35);
    // hotter (cyan/white) toward the center, cooler (pink/violet) at the rim
    const c = palette[(Math.random() * palette.length) | 0];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  for (let i = 0; i < count; i++) { seed(i, false); write(i); }

  function write(i) {
    const r = rad[i];
    positions[i * 3] = Math.cos(ang[i]) * r;
    positions[i * 3 + 1] = Math.sin(ang[i]) * r;
    positions[i * 3 + 2] = zoff[i] * (r / rOut);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: opts.size ?? 0.055,
    map: softCircle(),
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  // tilt into an accretion disk
  points.rotation.x = opts.tilt ?? 1.15;
  points.rotation.z = opts.roll ?? -0.25;

  const attr = geo.getAttribute('position');

  return {
    object3d: points,
    update(t, dt) {
      const step = Math.min(dt ?? 0.016, 0.05);
      for (let i = 0; i < count; i++) {
        // angular speed rises as particles fall inward (Keplerian-ish)
        ang[i] += spd[i] * (0.4 + (rOut - rad[i]) / rOut) * step;
        rad[i] -= inflow[i] * step;
        if (rad[i] <= rIn) seed(i, true); // respawn at the rim
        write(i);
      }
      attr.needsUpdate = true;
      mat.opacity = 0.8 + Math.sin(t * 0.7) * 0.12;
    },
  };
}
