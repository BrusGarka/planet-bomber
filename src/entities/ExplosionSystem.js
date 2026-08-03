import * as THREE from 'three';
import { CONFIG, cellCenterLat, cellCenterLon } from '../config/gameConfig.js';
import { placeOnSurface } from '../math/spherical.js';

export class ExplosionSystem {
  #scene;
  #active = [];

  constructor(scene) {
    this.#scene = scene;
  }

  clear() {
    for (const fx of this.#active) this.#scene.remove(fx.group);
    this.#active.length = 0;
  }

  spawn(band, col) {
    const lat = cellCenterLat(band);
    const lon = cellCenterLon(col);
    const group = new THREE.Group();
    const matFire = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.92 });
    const matCore = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.95 });
    const sizes = [0.22, 0.16, 0.14, 0.12];

    for (let i = 0; i < sizes.length; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sizes[i], sizes[i] * 0.6, sizes[i]),
        i === 0 ? matCore : matFire,
      );
      placeOnSurface(mesh, lat, lon, 0.1 + i * 0.04);
      group.add(mesh);
    }

    this.#scene.add(group);
    this.#active.push({ group, born: performance.now() });
  }

  update(now) {
    for (let i = this.#active.length - 1; i >= 0; i--) {
      const fx = this.#active[i];
      const t = (now - fx.born) / CONFIG.EXPLOSION_LIFE_MS;
      for (const mesh of fx.group.children) {
        mesh.material.opacity = Math.max(0, 0.95 * (1 - t));
        mesh.scale.setScalar(1 + t * 0.6);
      }
      if (now - fx.born >= CONFIG.EXPLOSION_LIFE_MS) {
        this.#scene.remove(fx.group);
        this.#active.splice(i, 1);
      }
    }
  }
}
