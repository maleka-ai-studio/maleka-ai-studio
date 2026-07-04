// ── Maleka AI Studio · Backdrop ───────────────────────────────────
// The cinematic environment behind the AI core: a large gradient plane
// (deep navy, lit toward the orb, darkened on the left so hero copy stays
// legible), a faint holographic grid, and a couple of huge soft nebula
// sprites for colored depth. Everything is additive/unlit and cheap.
// Returns { object3d, update(t), setFocus(x) }.

import * as THREE from 'three';
import { radialGlow } from './textures.js';

function gradientTexture(focusX = 0.56, darkLeft = true) {
  const w = 512, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // near-black base for deep contrast
  ctx.fillStyle = '#03040a';
  ctx.fillRect(0, 0, w, h);

  // lit halo around the orb focus
  const fx = focusX * w, fy = 0.5 * h;
  const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.55);
  glow.addColorStop(0, 'rgba(44,70,168,0.40)');
  glow.addColorStop(0.35, 'rgba(32,42,128,0.20)');
  glow.addColorStop(0.7, 'rgba(15,16,50,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // violet lift top-right, cyan hint lower-right
  const v = ctx.createRadialGradient(w * 0.82, h * 0.2, 0, w * 0.82, h * 0.2, w * 0.5);
  v.addColorStop(0, 'rgba(120,70,220,0.28)');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  const cy = ctx.createRadialGradient(w * 0.6, h * 0.9, 0, w * 0.6, h * 0.9, w * 0.45);
  cy.addColorStop(0, 'rgba(30,150,190,0.20)');
  cy.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cy;
  ctx.fillRect(0, 0, w, h);

  // darken the left half for legible copy (desktop layout)
  if (darkLeft) {
    const left = ctx.createLinearGradient(0, 0, w * 0.6, 0);
    left.addColorStop(0, 'rgba(3,4,9,0.96)');
    left.addColorStop(0.6, 'rgba(3,4,9,0.35)');
    left.addColorStop(1, 'rgba(3,4,9,0)');
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, w, h);
  }

  // faint holographic grid
  ctx.strokeStyle = 'rgba(90,130,220,0.05)';
  ctx.lineWidth = 1;
  const step = w / 22;
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();

  // strong vignette — pull the edges to near-black for deep contrast
  const vig = ctx.createRadialGradient(fx, fy, w * 0.25, fx, fy, w * 0.72);
  vig.addColorStop(0, 'rgba(3,4,10,0)');
  vig.addColorStop(0.7, 'rgba(2,3,8,0.35)');
  vig.addColorStop(1, 'rgba(1,2,6,0.92)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createBackdrop(opts = {}) {
  const group = new THREE.Group();

  // big gradient plane, far behind everything
  const tex = gradientTexture(opts.focusX ?? 0.56, opts.darkLeft ?? true);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(opts.planeW ?? 40, opts.planeH ?? 26),
    new THREE.MeshBasicMaterial({ map: tex, depthWrite: false, depthTest: false })
  );
  plane.position.z = -12;
  plane.renderOrder = -10;
  group.add(plane);

  // soft nebula clouds for colored depth
  const nebTex = radialGlow();
  const nebDefs = [
    { c: 0x3d6bff, p: [3.2, 1.0, -7],  s: 16, o: 0.30 },
    { c: 0x8257ff, p: [5.0, 2.4, -8],  s: 13, o: 0.26 },
    { c: 0x2ad8ee, p: [2.0, -2.4, -7], s: 11, o: 0.18 },
    { c: 0xff5d9e, p: [6.2, -1.6, -9], s: 9,  o: 0.16 },
    { c: 0x1b2f8a, p: [1.0, 2.6, -10], s: 20, o: 0.22 }, // distant blue haze
    { c: 0x5a2fb0, p: [7.0, 0.4, -11], s: 18, o: 0.16 }, // distant violet haze
  ];
  const nebulae = nebDefs.map((d) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebTex, color: d.c, transparent: true, opacity: d.o,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    }));
    sp.scale.set(d.s, d.s, 1);
    sp.position.set(d.p[0], d.p[1], d.p[2]);
    sp.renderOrder = -9;
    sp.userData.home = sp.position.clone();
    sp.userData.baseOpacity = d.o;
    group.add(sp);
    return sp;
  });

  return {
    object3d: group,
    update(t) {
      nebulae.forEach((n, i) => {
        const h = n.userData.home;
        n.position.x = h.x + Math.sin(t * 0.12 + i) * 0.5;
        n.position.y = h.y + Math.cos(t * 0.1 + i) * 0.4;
        n.material.opacity = n.userData.baseOpacity * (0.8 + Math.sin(t * 0.5 + i) * 0.2);
      });
    },
  };
}
