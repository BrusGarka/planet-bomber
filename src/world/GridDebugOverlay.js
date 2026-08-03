import * as THREE from 'three';
import { CONFIG, cellCenterLat, cellCenterLon, bandLat } from '../config/gameConfig.js';
import { sphericalToCartesian, placeOnSurface } from '../math/spherical.js';

/**
 * Overlay de debug do grid esférico.
 *
 * Nomenclatura (para falar do mapa):
 * - Faixa F1..F7 = bandas de latitude (1 = norte → 7 = sul)
 * - Coluna C1..Cn = fatias de longitude (sentido oeste→leste a partir de -π)
 * - Célula = F{f}C{c}  (ex.: F4C2 = spawn típico)
 *
 * Toggle: tecla G (default off).
 */
export class GridDebugOverlay {
  #scene;
  #root = new THREE.Group();
  #enabled = false;
  #built = false;

  constructor(scene) {
    this.#scene = scene;
    this.#root.visible = false;
    this.#root.name = 'GridDebugOverlay';
    scene.add(this.#root);
    if (CONFIG.DEBUG_GRID_DEFAULT) this.setEnabled(true);
  }

  get enabled() {
    return this.#enabled;
  }

  setEnabled(on) {
    this.#enabled = on;
    if (on && !this.#built) this.#build();
    this.#root.visible = on;
  }

  toggle() {
    this.setEnabled(!this.#enabled);
    return this.#enabled;
  }

  #build() {
    this.#built = true;
    this.#root.add(this.#buildMeridians());
    this.#root.add(this.#buildParallels());
    this.#root.add(this.#buildCellLabels());
    this.#root.add(this.#buildBandTags());
  }

  /** Meridianos: bordas entre colunas (longitude). */
  #buildMeridians() {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const latMin = bandLat(CONFIG.LAT_BANDS - 1) - CONFIG.BAND_HEIGHT / 2;
    const latMax = bandLat(0) + CONFIG.BAND_HEIGHT / 2;
    const steps = 24;
    const r = CONFIG.PLANET_RADIUS + 0.012;

    for (let c = 0; c < CONFIG.LON_SLICES; c++) {
      const lon = c * (2 * Math.PI / CONFIG.LON_SLICES) - Math.PI;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = latMin + (latMax - latMin) * t;
        pts.push(sphericalToCartesian(lat, lon, r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geo, mat));
    }
    return group;
  }

  /** Paralelos: bordas norte/sul de cada faixa (latitude). */
  #buildParallels() {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const r = CONFIG.PLANET_RADIUS + 0.012;
    const lonSteps = 48;

    for (let b = 0; b < CONFIG.LAT_BANDS; b++) {
      const latN = bandLat(b) + CONFIG.BAND_HEIGHT / 2;
      const latS = bandLat(b) - CONFIG.BAND_HEIGHT / 2;
      group.add(this.#parallelRing(latN, r, lonSteps, mat));
      if (b === CONFIG.LAT_BANDS - 1) {
        group.add(this.#parallelRing(latS, r, lonSteps, mat));
      }
    }
    return group;
  }

  #parallelRing(lat, radius, steps, mat) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const lon = -Math.PI + (i / steps) * 2 * Math.PI;
      pts.push(sphericalToCartesian(lat, lon, radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(geo, mat);
  }

  /** Label em cada célula: F#C# */
  #buildCellLabels() {
    const group = new THREE.Group();
    const size = CONFIG.BLOCK_SCALE * 0.85;

    for (let b = 0; b < CONFIG.LAT_BANDS; b++) {
      for (let c = 0; c < CONFIG.LON_SLICES; c++) {
        const label = `F${b + 1}C${c + 1}`;
        const sprite = this.#makeTextPlane(label, size * 2.2, size * 1.0, 0x111822, 0xe8f4ff);
        placeOnSurface(sprite, cellCenterLat(b), cellCenterLon(c), 0.04);
        group.add(sprite);
      }
    }
    return group;
  }

  /** Tags grandes na faixa (lado oeste) e na coluna (equador playable). */
  #buildBandTags() {
    const group = new THREE.Group();
    const midCol = 0;
    for (let b = 0; b < CONFIG.LAT_BANDS; b++) {
      const tag = this.#makeTextPlane(`Faixa ${b + 1}`, 0.55, 0.18, 0x3a2810, 0xffe0a0);
      placeOnSurface(tag, cellCenterLat(b), cellCenterLon(midCol), 0.08);
      group.add(tag);
    }
    const midBand = Math.floor(CONFIG.LAT_BANDS / 2);
    for (let c = 0; c < CONFIG.LON_SLICES; c += Math.max(1, Math.floor(CONFIG.LON_SLICES / 8))) {
      const tag = this.#makeTextPlane(`Col ${c + 1}`, 0.4, 0.16, 0x102838, 0xa8e0ff);
      placeOnSurface(tag, cellCenterLat(midBand), cellCenterLon(c), 0.09);
      group.add(tag);
    }
    return group;
  }

  #makeTextPlane(text, width, height, bg, fg) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(${(bg >> 16) & 255},${(bg >> 8) & 255},${bg & 255},0.72)`;
    ctx.beginPath();
    const x = 8, y = 16, w = canvas.width - 16, h = canvas.height - 32, r = 12;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `#${fg.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    // Plano no XY local: fica deitado? Queremos face para fora = +Y após placeOnSurface.
    // PlaneGeometry está em XY; após makeSurfaceMatrix, +Y = normal → plano paralelo à superfície.
    // Rotaciona 90° em X para ficar "em pé" tangente? Melhor: plano no XZ (chão) lendo de cima.
    // Com placeOnSurface, +Y = fora; PlaneGeometry XY fica vertical no meridiano.
    // Quero label flat on surface facing outward: rotate plane so normal = +Y.
    // Default PlaneGeometry normal = +Z. After basis (east,up,north), local +Z = north.
    // Rotate -90° around X: local +Z → +Y (outward).
    mesh.rotateX(-Math.PI / 2);
    return mesh;
  }
}
