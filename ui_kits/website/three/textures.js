// ── Maleka AI Studio · 3D texture helpers ─────────────────────────
// Tiny procedural canvas textures shared by the WebGL scene. White by
// design so sprite materials can tint them via `material.color` and
// composite with additive blending. No external image assets.

import * as THREE from 'three';

function make(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Soft round dot — used for particles and ring nodes.
export const softCircle = (size = 64) => make(size, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
});

// Broad radial halo — the soft bloom behind the orb.
export const radialGlow = (size = 256) => make(size, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.22, 'rgba(150,190,255,0.55)');
  g.addColorStop(0.5, 'rgba(90,130,255,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
});

// Horizontal light streak, faded on all edges — used for light beams.
export const beamStripe = (size = 256) => make(size, (ctx, s) => {
  const h = ctx.createLinearGradient(0, 0, s, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)');
  h.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  h.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, s, s);
  // fade the vertical edges so the beam reads as a soft core line
  const v = ctx.createLinearGradient(0, 0, 0, s);
  v.addColorStop(0, 'rgba(0,0,0,1)');
  v.addColorStop(0.5, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, s, s);
  ctx.globalCompositeOperation = 'source-over';
});
