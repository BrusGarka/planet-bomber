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
  MENU: 'menu',
  PLAYING: 'playing',
  DEAD: 'dead',
});

const BASE_CONFIG = Object.freeze({
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
  // Posição no meridiano (ELEV=0). lookAt(origem) → disco centrado L–R.
  // BACK = quanto a câmera fica ao sul do jogador (jogador sobe na tela).
  CAM_ALT: 5.5,
  CAM_ANGULAR_BACK: 0.40,
  CAM_ANGULAR_ELEV: 0,
  CAM_LOOK_AHEAD: 0,
  CAM_LOOK_DOWN: 0,
  CAM_FOLLOW: 14,
  FOV: 36,
  DEBUG_GRID_DEFAULT: false,
  MAX_DT: 0.05,
});

/**
 * Config ativa (mutável): cada fase aplica seus overrides sobre BASE_CONFIG.
 * Módulos leem CONFIG.X em tempo de execução — não copiem valores no import.
 */
export const CONFIG = { ...BASE_CONFIG };

export function applyConfigOverrides(overrides = {}) {
  Object.assign(CONFIG, BASE_CONFIG, overrides);
}

/**
 * Layout de faixas derivado de LAT_BANDS (sempre ímpar):
 * bordas = muralha, ímpares = rua, pares internos = xadrez.
 * Para 7 faixas resulta no layout clássico original.
 */
export function bandType(index) {
  if (index === 0 || index === CONFIG.LAT_BANDS - 1) return BandType.BARRIER;
  return index % 2 === 1 ? BandType.STREET : BandType.CHECKER;
}



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
