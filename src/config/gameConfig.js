export const CellType = Object.freeze({
  EMPTY: 'empty',
  BARRIER: 'barrier',
  CHECKER: 'checker',
  DESTRUCTIBLE: 'destructible',
});

export const BandType = Object.freeze({
  BARRIER: 'barrier',
  STREET: 'street',
  CHECKER: 'checker',
});

export const GameState = Object.freeze({
  PLAYING: 'playing',
  DEAD: 'dead',
});

export const CONFIG = Object.freeze({
  // Planeta compacto
  PLANET_RADIUS: 2.0,
  LAT_BANDS: 7,
  LON_SLICES: 16,
  BAND_HEIGHT: 0.38,
  BLOCK_SCALE: 0.24,
  PLAYER_FLOAT: 0.28,
  /** Arco / s no meridiano (rad). Lon usa speed/cos(φ) — ver docs/FISICA-ESFERICA.md */
  PLAYER_MOVE_SPEED: 1.65,
  SPAWN_BAND: 3,
  SPAWN_COL: 1,
  SPAWN_CLEAR_RADIUS: 2,
  CRATE_FILL_CHANCE: 0.42,
  COLLISION_MARGIN: 0.62,
  BOMB_FUSE_MS: 3000,
  BOMB_HEIGHT: 0.11,
  EXPLOSION_RADIUS_CELLS: 2,
  EXPLOSION_LIFE_MS: 520,

  // Órbita satélite (ângulos em radianos)
  CAM_ALT: 4.0,
  CAM_ANGULAR_BACK: 0.42,
  CAM_ANGULAR_ELEV: 0.28,
  CAM_LOOK_AHEAD: 0.15,
  CAM_LOOK_DOWN: 0.12,
  CAM_FOLLOW: 14,
  FOV: 42,
  MAX_DT: 0.05,
});

export const BAND_LAYOUT = Object.freeze([
  BandType.BARRIER,
  BandType.STREET,
  BandType.CHECKER,
  BandType.STREET,
  BandType.CHECKER,
  BandType.STREET,
  BandType.BARRIER,
]);

export function bandLat(index) {
  const total = (CONFIG.LAT_BANDS - 1) * CONFIG.BAND_HEIGHT;
  const start = total / 2;
  return start - index * CONFIG.BAND_HEIGHT;
}

export function cellCenterLat(band) {
  return bandLat(band);
}

export function cellCenterLon(col) {
  return (col + 0.5) * (2 * Math.PI / CONFIG.LON_SLICES) - Math.PI;
}
