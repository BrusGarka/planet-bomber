import * as THREE from 'three';
import { CONFIG, CellType, cellCenterLat, cellCenterLon } from '../config/gameConfig.js';
import { placeOnSurface } from '../math/spherical.js';

export class BlockManager {
  #scene;
  #grid;
  #meshes = new Map();
  #stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a9098, roughness: 0.55, metalness: 0.15 });
  #crateMat = new THREE.MeshStandardMaterial({ color: 0xc47a2a, roughness: 0.88, metalness: 0.02 });
  #geometry = new THREE.BoxGeometry(CONFIG.BLOCK_SCALE, CONFIG.BLOCK_SCALE, CONFIG.BLOCK_SCALE);
  #geometryScale = CONFIG.BLOCK_SCALE;
  #blockTop = CONFIG.BLOCK_SCALE / 2;

  constructor(scene, grid) {
    this.#scene = scene;
    this.#grid = grid;
  }

  rebuild() {
    this.clear();
    if (this.#geometryScale !== CONFIG.BLOCK_SCALE) {
      this.#geometry.dispose();
      this.#geometryScale = CONFIG.BLOCK_SCALE;
      this.#geometry = new THREE.BoxGeometry(CONFIG.BLOCK_SCALE, CONFIG.BLOCK_SCALE, CONFIG.BLOCK_SCALE);
      this.#blockTop = CONFIG.BLOCK_SCALE / 2;
    }
    for (let band = 0; band < CONFIG.LAT_BANDS; band++) {
      for (let col = 0; col < CONFIG.LON_SLICES; col++) {
        const type = this.#grid.get(band, col);
        if (this.#grid.isSolid(type)) this.#place(band, col, type);
      }
    }
  }

  clear() {
    for (const mesh of this.#meshes.values()) this.#scene.remove(mesh);
    this.#meshes.clear();
  }

  destroyAt(band, col) {
    const key = this.#key(band, col);
    const mesh = this.#meshes.get(key);
    if (!mesh) return;
    this.#scene.remove(mesh);
    this.#meshes.delete(key);
    this.#grid.set(band, col, CellType.EMPTY);
  }

  #place(band, col, type) {
    const lat = cellCenterLat(band);
    const lon = cellCenterLon(col);
    const material = this.#grid.isIndestructible(type) ? this.#stoneMat : this.#crateMat;
    const mesh = new THREE.Mesh(this.#geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    placeOnSurface(mesh, lat, lon, this.#blockTop);
    mesh.userData = { band, col, type };
    this.#scene.add(mesh);
    this.#meshes.set(this.#key(band, col), mesh);
  }

  #key(band, col) {
    return `${band},${col}`;
  }
}
