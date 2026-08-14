import * as THREE from 'three';
import { CONFIG, CellType, cellCenterLat, cellCenterLon } from '../config/gameConfig.js';
import { placeOnSurface } from '../math/spherical.js';
import { createCellFrustumGeometry } from '../math/cellFrustum.js';

export class BlockManager {
  #scene;
  #grid;
  #meshes = new Map();
  #stoneMat = new THREE.MeshStandardMaterial({
    color: 0x8a9098,
    roughness: 0.55,
    metalness: 0.15,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  #crateMat = new THREE.MeshStandardMaterial({
    color: 0xc47a2a,
    roughness: 0.88,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
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
    for (const mesh of this.#meshes.values()) {
      this.#scene.remove(mesh);
      if (mesh.userData.ownsGeometry) mesh.geometry.dispose();
    }
    this.#meshes.clear();
  }

  destroyAt(band, col) {
    const key = this.#key(band, col);
    const mesh = this.#meshes.get(key);
    if (!mesh) return;
    this.#scene.remove(mesh);
    if (mesh.userData.ownsGeometry) mesh.geometry.dispose();
    this.#meshes.delete(key);
    this.#grid.set(band, col, CellType.EMPTY);
  }

  #place(band, col, type) {
    const material = this.#grid.isIndestructible(type) ? this.#stoneMat : this.#crateMat;
    const frustum = this.#usesCellFrustum();
    const mesh = frustum
      ? this.#placeFrustum(band, col, material)
      : this.#placeCube(band, col, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { band, col, type, ownsGeometry: frustum };
    this.#scene.add(mesh);
    this.#meshes.set(this.#key(band, col), mesh);
  }

  #placeCube(band, col, material) {
    const mesh = new THREE.Mesh(this.#geometry, material);
    placeOnSurface(mesh, cellCenterLat(band), cellCenterLon(col), this.#blockTop);
    return mesh;
  }

  #placeFrustum(band, col, material) {
    return new THREE.Mesh(createCellFrustumGeometry(band, col), material);
  }

  #usesCellFrustum() {
    return CONFIG.BLOCK_SHAPE === 'cell-frustum';
  }

  #key(band, col) {
    return `${band},${col}`;
  }
}
