// ── Maleka AI Studio · MotionBackground ───────────────────────────
// Cinematic lighting + soft light beams for the hero scene. Adds the
// colored point lights that model the orb (blue / cyan / violet / pink)
// and a few additive beam sprites for depth. Lights are attached to the
// passed-in scene; beams live in the returned group.
// Returns { object3d, lights, update(t) }.

import * as THREE from 'three';
import { beamStripe } from './textures.js';

export function createMotionBackground(scene, opts = {}) {
  const group = new THREE.Group();

  // base ambient so shadowed faces keep a cool navy tint
  scene.add(new THREE.AmbientLight(0x223066, 0.7));

  const lightDefs = [
    { c: 0x3d6bff, p: [4, 2, 3],   i: 32 }, // electric blue
    { c: 0x2ad8ee, p: [-4, 1, 2],  i: 24 }, // cyan
    { c: 0x8257ff, p: [0, -3, 3],  i: 22 }, // violet
    { c: 0xff5d9e, p: [-2, 3, -1], i: 14 }, // soft pink
  ];
  const lights = lightDefs.map((d) => {
    const l = new THREE.PointLight(d.c, d.i, 30, 2);
    l.position.set(d.p[0], d.p[1], d.p[2]);
    l.userData.home = l.position.clone();
    scene.add(l);
    return l;
  });

  // soft light beams behind the orb
  const beamTex = beamStripe();
  const beamDefs = [
    { c: 0x3d6bff, rot: 0.4,  s: [7.5, 2.4] },
    { c: 0x8257ff, rot: -0.7, s: [6.0, 1.7] },
    { c: 0x2ad8ee, rot: 1.4,  s: [5.2, 1.3] },
  ];
  const beams = beamDefs.map((d) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: beamTex, color: d.c, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.45,
    }));
    sp.scale.set(d.s[0], d.s[1], 1);
    sp.material.rotation = d.rot;
    sp.position.z = -1.6;
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
        l.position.x = h.x + Math.sin(t * 0.3 + i) * 0.4;
        l.position.y = h.y + Math.cos(t * 0.25 + i) * 0.3;
      });
      group.rotation.z = Math.sin(t * 0.05) * 0.1;
      beams.forEach((b, i) => { b.material.opacity = 0.3 + Math.sin(t * 0.4 + i) * 0.16; });
    },
  };
}
