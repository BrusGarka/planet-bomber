import {
  bandType,
  CONFIG,
  CellType,
  BandType,
  cellCenterLat,
  cellCenterLon,
} from '../config/gameConfig.js';

export class Grid {
  #cells = [];

  constructor() {
    this.regenerate();
  }

  get cells() {
    return this.#cells;
  }

  get(band, col) {
    return this.#cells[band]?.[col];
  }

  set(band, col, type) {
    this.#cells[band][col] = type;
  }

  isSpawnArea(band, col) {
    const db = Math.abs(band - CONFIG.SPAWN_BAND);
    const dc = Math.min(
      Math.abs(col - CONFIG.SPAWN_COL),
      CONFIG.LON_SLICES - Math.abs(col - CONFIG.SPAWN_COL),
    );
    return db + dc <= CONFIG.SPAWN_CLEAR_RADIUS;
  }

  isSolid(type) {
    return type === CellType.BARRIER
      || type === CellType.CHECKER
      || type === CellType.DESTRUCTIBLE;
  }

  isIndestructible(type) {
    return type === CellType.BARRIER || type === CellType.CHECKER;
  }

  canPlaceBomb(band, col) {
    return !this.isSolid(this.get(band, col));
  }

  regenerate() {
    this.#cells = this.#createBaseLayout();
    this.#clearSpawn();
    this.#scatterCrates();
  }

  getSpawnPosition() {
    return {
      lat: cellCenterLat(CONFIG.SPAWN_BAND),
      lon: cellCenterLon(CONFIG.SPAWN_COL),
    };
  }

  #createBaseLayout() {
    const rows = [];
    for (let band = 0; band < CONFIG.LAT_BANDS; band++) {
      const row = [];
      const type = bandType(band);
      for (let col = 0; col < CONFIG.LON_SLICES; col++) {
        if (type === BandType.BARRIER) row.push(CellType.BARRIER);
        else if (type === BandType.CHECKER) row.push(col % 2 === 0 ? CellType.CHECKER : CellType.EMPTY);
        else row.push(CellType.EMPTY);
      }
      rows.push(row);
    }
    return rows;
  }

  #clearSpawn() {
    for (let band = 0; band < CONFIG.LAT_BANDS; band++) {
      for (let col = 0; col < CONFIG.LON_SLICES; col++) {
        if (this.isSpawnArea(band, col) && this.get(band, col) === CellType.CHECKER) {
          this.set(band, col, CellType.EMPTY);
        }
      }
    }
  }

  #scatterCrates() {
    for (let band = 0; band < CONFIG.LAT_BANDS; band++) {
      if (bandType(band) !== BandType.STREET) continue;
      for (let col = 0; col < CONFIG.LON_SLICES; col++) {
        if (this.isSpawnArea(band, col)) continue;
        if (Math.random() < CONFIG.CRATE_FILL_CHANCE) this.set(band, col, CellType.DESTRUCTIBLE);
      }
    }
  }
}
