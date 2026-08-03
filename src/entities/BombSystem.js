import * as THREE from 'three';
import { CONFIG, CellType, cellCenterLat, cellCenterLon } from '../config/gameConfig.js';
import { cellAt, placeOnSurface } from '../math/spherical.js';

const EXPLOSION_DIRS = [
  { db: -1, dc: 0 },
  { db: +1, dc: 0 },
  { db: 0, dc: +1 },
  { db: 0, dc: -1 },
];

export class BombSystem {
  #scene;
  #grid;
  #blockManager;
  #explosions;
  #bombs = [];
  #geometry = new THREE.SphereGeometry(0.12, 14, 14);
  #bombMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.35, metalness: 0.5 });
  #fuseMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.9 });
  #onPlayerHit;

  constructor(scene, grid, blockManager, explosions, onPlayerHit) {
    this.#scene = scene;
    this.#grid = grid;
    this.#blockManager = blockManager;
    this.#explosions = explosions;
    this.#onPlayerHit = onPlayerHit;
  }

  get count() {
    return this.#bombs.length;
  }

  clear() {
    for (const bomb of this.#bombs) this.#scene.remove(bomb.mesh);
    this.#bombs.length = 0;
  }

  tryDrop(player) {
    const cell = cellAt(player.lat, player.lon);
    if (!cell) return;
    if (!this.#grid.canPlaceBomb(cell.band, cell.col)) return;
    if (this.#bombs.some((b) => b.band === cell.band && b.col === cell.col)) return;

    const lat = cellCenterLat(cell.band);
    const lon = cellCenterLon(cell.col);
    const mesh = new THREE.Mesh(this.#geometry, this.#bombMat);
    mesh.castShadow = true;
    placeOnSurface(mesh, lat, lon, CONFIG.BOMB_HEIGHT);
    this.#scene.add(mesh);

    this.#bombs.push({
      mesh,
      band: cell.band,
      col: cell.col,
      born: performance.now(),
    });
  }

  update(now, player) {
    for (let i = this.#bombs.length - 1; i >= 0; i--) {
      const bomb = this.#bombs[i];
      const age = now - bomb.born;
      const pulse = (Math.sin(age / 80) + 1) / 2;
      bomb.mesh.scale.setScalar(1 + 0.18 * pulse * (age / CONFIG.BOMB_FUSE_MS));
      bomb.mesh.material = Math.floor(age / 120) % 2 === 0 ? this.#bombMat : this.#fuseMat;

      if (age >= CONFIG.BOMB_FUSE_MS) {
        this.#explode(bomb, player);
        this.#bombs.splice(i, 1);
      }
    }
  }

  #explode(bomb, player) {
    this.#scene.remove(bomb.mesh);
    this.#explosions.spawn(bomb.band, bomb.col);
    this.#checkHit(bomb.band, bomb.col, player);

    for (const dir of EXPLOSION_DIRS) {
      for (let radius = 1; radius <= CONFIG.EXPLOSION_RADIUS_CELLS; radius++) {
        const band = bomb.band + dir.db * radius;
        const col = (bomb.col + dir.dc * radius + CONFIG.LON_SLICES) % CONFIG.LON_SLICES;
        if (band < 0 || band >= CONFIG.LAT_BANDS) break;

        const type = this.#grid.get(band, col);
        if (this.#grid.isIndestructible(type)) break;

        this.#explosions.spawn(band, col);
        this.#checkHit(band, col, player);

        if (type === CellType.DESTRUCTIBLE) {
          this.#blockManager.destroyAt(band, col);
          break;
        }
      }
    }
  }

  #checkHit(band, col, player) {
    const cell = cellAt(player.lat, player.lon);
    if (cell && cell.band === band && cell.col === col) this.#onPlayerHit();
  }
}
