// ── Maleka AI Studio · ThreeScene ─────────────────────────────────
// Reusable WebGL canvas + render-loop manager. Owns the renderer,
// scene, camera, resize handling, and a single animation loop. Objects
// registered via add()/onFrame() get an update(t, dt) callback each frame.
//
// Built-in performance guards:
//   · device-pixel-ratio clamp (2 desktop / 1.5 mobile)
//   · antialias off on mobile
//   · pauses the loop when the tab is hidden or the canvas scrolls
//     off-screen (IntersectionObserver)
//   · dispose() releases all GPU resources
//
// This module never throws to the page: callers should still guard with
// isWebGLAvailable() and fall back to the CSS visual when it returns false.

import * as THREE from 'three';

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

export class ThreeScene {
  constructor(mount, opts = {}) {
    this.mount = mount;
    this.updaters = [];
    this.resizeHooks = [];
    this.renderFn = null; // optional external render (e.g. bloom composer)
    this.running = false;
    this.clock = new THREE.Clock();

    this.isMobile = opts.isMobile ?? matchMedia('(max-width: 768px)').matches;
    this.dprCap = this.isMobile ? 1.5 : 2;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0); // transparent — composites over the page
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap));
    const el = this.renderer.domElement;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    mount.appendChild(el);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, opts.cameraZ ?? 6);

    this._loop = this._loop.bind(this);
    this._resize = this._resize.bind(this);

    this._ro = new ResizeObserver(this._resize);
    this._ro.observe(mount);
    this._resize();

    this._inView = true;
    this._onVis = () => {
      if (document.hidden) this.stop();
      else if (this._inView) this.start();
    };
    document.addEventListener('visibilitychange', this._onVis);

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          this._inView = e.isIntersecting;
          if (e.isIntersecting && !document.hidden) this.start();
          else this.stop();
        });
      }, { threshold: 0.01 });
      this._io.observe(mount);
    }
  }

  // Accepts a THREE.Object3D or a component { object3d, update }.
  add(item) {
    if (item.object3d) this.scene.add(item.object3d);
    else if (item.isObject3D) this.scene.add(item);
    if (typeof item.update === 'function') this.updaters.push(item);
    return item;
  }

  onFrame(fn) { this.updaters.push({ update: fn }); }

  // Register an external renderer (e.g. an EffectComposer) used in place of
  // the default renderer.render() each frame.
  setRender(fn) { this.renderFn = fn; }

  // Called on resize with (width, height, pixelRatio) — used to keep the
  // bloom composer's size in sync with the canvas.
  onResize(fn) { this.resizeHooks.push(fn); }

  _resize() {
    const w = this.mount.clientWidth || 1;
    const h = this.mount.clientHeight || 1;
    const pr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const fn of this.resizeHooks) fn(w, h, pr);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta(); // drop the paused gap
    this._raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  renderOnce() { this.renderer.render(this.scene, this.camera); }

  _loop() {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    for (const u of this.updaters) u.update(t, dt);
    if (this.renderFn) this.renderFn();
    else this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._loop);
  }

  dispose() {
    this.stop();
    this._ro?.disconnect();
    this._io?.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach((m) => {
        for (const key in m) {
          const v = m[key];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose?.();
      });
    });
    this.renderer.dispose();
    const el = this.renderer.domElement;
    if (el.parentNode) el.parentNode.removeChild(el);
  }
}
