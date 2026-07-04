// ── Maleka AI Studio · HeroAIOrb ──────────────────────────────────
// The cinematic glowing AI core. Layered for a premium, self-lit look
// without post-processing:
//   · dark metallic sphere (catches the colored point lights)
//   · additive Fresnel atmosphere shell (rim glow)
//   · hot inner core (pulsing)
//   · soft radial halo sprite (bloom stand-in)
//   · faint wireframe shell (subtle tech detail)
// Returns { object3d, update(t) }.

import * as THREE from 'three';
import { radialGlow } from './textures.js';

export function createHeroAIOrb(opts = {}) {
  const detail = opts.detail ?? 5;
  const group = new THREE.Group();

  // main orb — dark, lit by the scene's colored lights
  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, detail),
    new THREE.MeshStandardMaterial({
      color: 0x0a1740,
      emissive: 0x1b3aa0,
      emissiveIntensity: 0.55,
      metalness: 0.6,
      roughness: 0.35,
    })
  );
  group.add(orb);

  // Fresnel atmosphere / rim glow
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColorA: { value: new THREE.Color(0x2ad8ee) }, // cyan core-side
      uColorB: { value: new THREE.Color(0x8257ff) }, // violet rim
      uPower: { value: 2.6 },
      uIntensity: { value: 1.0 },
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
      uniform vec3 uColorA; uniform vec3 uColorB;
      uniform float uPower; uniform float uIntensity;
      void main() {
        vec3 viewDir = normalize(-vP);
        float f = pow(1.0 - max(dot(vN, viewDir), 0.0), uPower);
        vec3 col = mix(uColorA, uColorB, f);
        gl_FragColor = vec4(col, f * uIntensity);
      }`,
  });
  const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, detail), glowMat);
  group.add(glow);

  // hot inner core
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xdff2ff, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), coreMat);
  group.add(core);

  // soft halo bloom
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialGlow(), color: 0x3d6bff, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
  }));
  halo.scale.set(6.4, 6.4, 1);
  group.add(halo);

  // faint wireframe shell
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 2),
    new THREE.MeshBasicMaterial({
      color: 0x5ff0ff, wireframe: true, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  group.add(wire);

  return {
    object3d: group,
    update(t) {
      orb.rotation.y = t * 0.18;
      orb.rotation.x = Math.sin(t * 0.2) * 0.12;
      wire.rotation.y = -t * 0.12;
      wire.rotation.z = t * 0.06;
      const pulse = 0.9 + Math.sin(t * 1.6) * 0.12;
      core.scale.setScalar(pulse);
      coreMat.opacity = 0.8 + Math.sin(t * 1.6) * 0.15;
      glowMat.uniforms.uIntensity.value = 0.85 + Math.sin(t * 0.9) * 0.15;
      halo.material.opacity = 0.75 + Math.sin(t * 0.9) * 0.15;
    },
  };
}
