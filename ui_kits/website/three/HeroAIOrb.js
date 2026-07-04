// ── Maleka AI Studio · HeroAIOrb ──────────────────────────────────
// The cinematic glowing AI core. Layered for a premium, self-lit look
// that reads strongly under bloom:
//   · dark metallic sphere (catches the colored point lights)
//   · animated Fresnel atmosphere shell (rim glow, cyan→violet→pink)
//   · bright pulsing energy core + inner white-hot nucleus
//   · stacked additive halos (soft bloom seed) + anamorphic streak
//   · slowly counter-rotating wireframe shells (tech detail)
// Returns { object3d, update(t) }.

import * as THREE from 'three';
import { radialGlow, softCircle } from './textures.js';

export function createHeroAIOrb(opts = {}) {
  const detail = opts.detail ?? 5;
  const group = new THREE.Group();

  // main orb — dark, lit by the scene's colored lights
  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, detail),
    new THREE.MeshStandardMaterial({
      color: 0x0a1740,
      emissive: 0x2348c8,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.3,
    })
  );
  group.add(orb);

  // Fresnel atmosphere / rim glow (animated hue shift cyan→violet→pink)
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColorA: { value: new THREE.Color(0x2ad8ee) },
      uColorB: { value: new THREE.Color(0x8257ff) },
      uColorC: { value: new THREE.Color(0xff5d9e) },
      uPower: { value: 2.4 },
      uIntensity: { value: 1.25 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vP;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vP;
      uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
      uniform float uPower; uniform float uIntensity; uniform float uTime;
      void main() {
        vec3 viewDir = normalize(-vP);
        float f = pow(1.0 - max(dot(vN, viewDir), 0.0), uPower);
        float m = 0.5 + 0.5 * sin(uTime * 0.6 + f * 3.0);
        vec3 col = mix(mix(uColorA, uColorB, f), uColorC, m * f);
        gl_FragColor = vec4(col, f * uIntensity);
      }`,
  });
  const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(1.32, detail), glowMat);
  group.add(glow);

  // bright energy core + white-hot nucleus (strong bloom seeds)
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x9fe6ff, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), coreMat);
  group.add(core);

  const nucleusMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), nucleusMat);
  group.add(nucleus);

  // stacked additive halos — soft volumetric bloom seed
  const glowTex = radialGlow();
  const haloDefs = [
    { c: 0x3d6bff, s: 6.6, o: 0.55 },
    { c: 0x8257ff, s: 4.2, o: 0.5 },
    { c: 0x9fe6ff, s: 2.4, o: 0.7 },
  ];
  const halos = haloDefs.map((d) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: d.c, transparent: true, opacity: d.o,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(d.s, d.s, 1);
    sp.userData.base = d.o;
    group.add(sp);
    return sp;
  });

  // anamorphic light streak (lens-flare feel)
  const streak = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softCircle(), color: 0xbfe4ff, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  streak.scale.set(9, 0.28, 1);
  group.add(streak);

  // faint counter-rotating wireframe shells
  const wire1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.16, 2),
    new THREE.MeshBasicMaterial({ color: 0x5ff0ff, wireframe: true, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const wire2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.24, 1),
    new THREE.MeshBasicMaterial({ color: 0xa98bff, wireframe: true, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(wire1, wire2);

  return {
    object3d: group,
    update(t) {
      orb.rotation.y = t * 0.2;
      orb.rotation.x = Math.sin(t * 0.2) * 0.12;
      wire1.rotation.y = -t * 0.14; wire1.rotation.z = t * 0.06;
      wire2.rotation.y = t * 0.1; wire2.rotation.x = -t * 0.05;

      const pulse = 0.92 + Math.sin(t * 1.7) * 0.12;
      core.scale.setScalar(pulse);
      coreMat.opacity = 0.82 + Math.sin(t * 1.7) * 0.16;
      nucleus.scale.setScalar(0.9 + Math.sin(t * 2.3) * 0.14);

      glowMat.uniforms.uTime.value = t;
      glowMat.uniforms.uIntensity.value = 1.1 + Math.sin(t * 0.9) * 0.2;

      halos.forEach((h, i) => { h.material.opacity = h.userData.base * (0.75 + Math.sin(t * 0.8 + i) * 0.22); });
      streak.material.opacity = 0.5 + Math.sin(t * 1.2) * 0.25;
      streak.material.rotation = Math.sin(t * 0.15) * 0.15;
    },
  };
}
