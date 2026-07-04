// ── Maleka AI Studio · MotionBackground ───────────────────────────
// Cinematic lighting + soft light beams for the hero scene. Adds the
// colored point lights that model the orb (blue / cyan / violet / pink)
// and several additive beam sprites that fan out behind it for depth.
// Lights attach to the passed-in scene; beams live in the returned group.
// Returns { object3d, lights, update(t) }.

import * as THREE from 'three';
import { beamStripe } from './textures.js';

export function createMotionBackground(scene, opts = {}) {
  const group = new THREE.Group();

  scene.add(new THREE.AmbientLight(0x223066, 0.8));

  const lightDefs = [
    { c: 0x3d6bff, p: [4, 2, 3],   i: 46 }, // electric blue
    { c: 0x2ad8ee, p: [-4, 1, 2],  i: 34 }, // cyan
    { c: 0x8257ff, p: [0, -3, 3],  i: 32 }, // violet
    { c: 0xff5d9e, p: [-2, 3, -1], i: 22 }, // soft pink
    { c: 0x6f9bff, p: [2, 3, -3],  i: 18 }, // blue backlight
  ];
  const lights = lightDefs.map((d) => {
    const l = new THREE.PointLight(d.c, d.i, 34, 2);
    l.position.set(d.p[0], d.p[1], d.p[2]);
    l.userData.home = l.position.clone();
    scene.add(l);
    return l;
  });

  // soft light beams fanning behind the orb
  const beamTex = beamStripe();
  const beamDefs = [
    { c: 0x3d6bff, rot: 0.35, s: [9.0, 2.6], o: 0.5 },
    { c: 0x8257ff, rot: -0.6, s: [7.5, 1.9], o: 0.42 },
    { c: 0x2ad8ee, rot: 1.3,  s: [6.5, 1.5], o: 0.4 },
    { c: 0xff5d9e, rot: 2.3,  s: [5.5, 1.1], o: 0.28 },
  ];
  const beams = beamDefs.map((d) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: beamTex, color: d.c, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: d.o,
    }));
    sp.scale.set(d.s[0], d.s[1], 1);
    sp.material.rotation = d.rot;
    sp.position.z = -1.8;
    sp.userData.base = d.o;
    group.add(sp);
    return sp;
  });

  scene.add(group);

  return {
    object3d: group,
    lights,
    update(t) {
      lights.forEach((l, i) => {
        const h = l.userData.home;
        l.position.x = h.x + Math.sin(t * 0.3 + i) * 0.5;
        l.position.y = h.y + Math.cos(t * 0.25 + i) * 0.4;
      });
      group.rotation.z = Math.sin(t * 0.05) * 0.12;
      beams.forEach((b, i) => { b.material.opacity = b.userData.base * (0.6 + Math.sin(t * 0.4 + i) * 0.4); });
    },
  };
}
