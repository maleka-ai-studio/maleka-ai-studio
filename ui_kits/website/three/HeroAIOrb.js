// ── Maleka AI Studio · HeroAIOrb (Energy Core) ────────────────────
// A premium abstract energy object — not a plain ball. The body is a
// noise-displaced icosphere driven by a custom shader: a dark navy mass
// with glowing energy veins and a bright fresnel rim that roils over
// time. Wrapped in additive layers (atmosphere, nucleus, halos, streak,
// wireframe, back disc) so it reads as a dominant, alive core.
//
// Simplex noise: Ashima / Stefan Gustavson (public domain).
// Returns { object3d, update(t) }.

import * as THREE from 'three';
import { radialGlow, softCircle } from './textures.js';

const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

export function createHeroAIOrb(opts = {}) {
  const detail = opts.detail ?? 5;
  const R = opts.radius ?? 1.5;
  const group = new THREE.Group();

  // ── displaced energy body (opaque, structured) ────────────────
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: R * 0.16 },
      uFreq: { value: 1.15 },
      uDeep: { value: new THREE.Color(0x05081c) },
      uHot: { value: new THREE.Color(0x2a5cf0) },
      uHot2: { value: new THREE.Color(0x2fd2ff) },
      uRim: { value: new THREE.Color(0x9a7dff) },
    },
    vertexShader: `${SNOISE}
      uniform float uTime; uniform float uAmp; uniform float uFreq;
      varying vec3 vN; varying vec3 vP; varying float vNoise;
      void main() {
        float n1 = snoise(normal * uFreq + vec3(0.0, 0.0, uTime * 0.28));
        float n2 = snoise(position * uFreq * 1.9 - vec3(uTime * 0.18));
        float disp = n1 * 0.72 + n2 * 0.28;
        vNoise = disp;
        vec3 pos = position + normal * disp * uAmp;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        vP = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uDeep; uniform vec3 uHot; uniform vec3 uHot2; uniform vec3 uRim;
      uniform float uTime;
      varying vec3 vN; varying vec3 vP; varying float vNoise;
      void main() {
        vec3 viewDir = normalize(-vP);
        float fres = pow(1.0 - max(dot(vN, viewDir), 0.0), 2.1);
        float energy = smoothstep(-0.25, 0.65, vNoise);
        float veins = smoothstep(0.58, 0.92, energy) ;
        vec3 hot = mix(uHot, uHot2, 0.5 + 0.5 * sin(uTime * 0.5 + vNoise * 4.0));
        vec3 body = mix(uDeep, hot, energy * 0.42);
        body += hot * veins * 0.5;
        vec3 col = body + uRim * fres * 1.05;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(R, detail), bodyMat);
  group.add(body);

  // ── additive fresnel atmosphere (rim halo) ────────────────────
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uColorA: { value: new THREE.Color(0x2ad8ee) },
      uColorB: { value: new THREE.Color(0x8257ff) },
      uColorC: { value: new THREE.Color(0xff5d9e) },
      uPower: { value: 2.6 }, uIntensity: { value: 1.15 }, uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vP;
      void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vP=mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vP;
      uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
      uniform float uPower; uniform float uIntensity; uniform float uTime;
      void main(){
        vec3 vd = normalize(-vP);
        float f = pow(1.0 - max(dot(vN, vd), 0.0), uPower);
        float m = 0.5 + 0.5 * sin(uTime * 0.6 + f * 3.0);
        vec3 col = mix(mix(uColorA, uColorB, f), uColorC, m * f);
        gl_FragColor = vec4(col, f * uIntensity);
      }`,
  });
  const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 1.16, 4), glowMat);
  group.add(glow);

  // ── bright inner nucleus (energy center) ──────────────────────
  const nucleusMat = new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(R * 0.16, 24, 24), nucleusMat);
  group.add(nucleus);

  // ── stacked halos (soft bloom seed) ───────────────────────────
  const glowTex = radialGlow();
  const haloDefs = [
    { c: 0x3d6bff, s: R * 4.4, o: 0.34 },
    { c: 0x8257ff, s: R * 2.8, o: 0.3 },
    { c: 0x9fe6ff, s: R * 1.6, o: 0.42 },
  ];
  const halos = haloDefs.map((d) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: d.c, transparent: true, opacity: d.o, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(d.s, d.s, 1); sp.userData.base = d.o; group.add(sp); return sp;
  });

  // ── large faint rotating energy disc behind the core (depth) ──
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2748c0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.scale.set(R * 8.5, R * 8.5, 1); disc.position.z = -1.2; group.add(disc);

  // ── anamorphic streak (lens flare feel) ───────────────────────
  const streak = new THREE.Sprite(new THREE.SpriteMaterial({ map: softCircle(), color: 0xbfe4ff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }));
  streak.scale.set(R * 5, R * 0.18, 1); group.add(streak);

  // ── faint additive wireframe outer shell ──────────────────────
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(R * 1.22, 2),
    new THREE.MeshBasicMaterial({ color: 0x5ff0ff, wireframe: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(wire);

  return {
    object3d: group,
    update(t) {
      bodyMat.uniforms.uTime.value = t;
      glowMat.uniforms.uTime.value = t;
      body.rotation.y = t * 0.16;
      body.rotation.x = Math.sin(t * 0.18) * 0.1;
      wire.rotation.y = -t * 0.12; wire.rotation.z = t * 0.05;
      nucleus.scale.setScalar(0.9 + Math.sin(t * 2.1) * 0.14);
      nucleusMat.opacity = 0.82 + Math.sin(t * 2.1) * 0.16;
      glowMat.uniforms.uIntensity.value = 1.05 + Math.sin(t * 0.9) * 0.2;
      halos.forEach((h, i) => { h.material.opacity = h.userData.base * (0.75 + Math.sin(t * 0.8 + i) * 0.22); });
      disc.material.rotation = t * 0.05;
      disc.material.opacity = 0.18 + Math.sin(t * 0.4) * 0.07;
      streak.material.opacity = 0.3 + Math.sin(t * 1.2) * 0.16;
      streak.material.rotation = Math.sin(t * 0.15) * 0.12;
    },
  };
}
