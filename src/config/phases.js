import { applyConfigOverrides } from './gameConfig.js';

/**
 * Overrides por fase. Blocos têm sempre o mesmo tamanho (BLOCK_SCALE):
 * a densidade vem do raio do planeta e do passo angular do grid.
 */
const PHASE_CONFIGS = Object.freeze({
  // Planeta 1 — referência (grid folgado)
  p1: Object.freeze({}),

  // Planeta 2 — planeta pequeno (~metade do raio), blocos quase colados
  p2: Object.freeze({
    PLANET_RADIUS: 1.1,
    LON_SLICES: 20,
    BAND_HEIGHT: 0.315,
    CAM_ALT: 4.6,
    PLAYER_MOVE_SPEED: 2.6,
  }),

  // Planeta 3 — cópia do 1 (mesmo raio) com grid muito mais denso
  p3: Object.freeze({
    PLANET_RADIUS: 2.0,
    LON_SLICES: 44,
    BAND_HEIGHT: 0.145,
    CAM_ALT: 6.8,
    PLAYER_MOVE_SPEED: 0.95,
    SPAWN_COL: 3,
    EXPLOSION_RADIUS_CELLS: 3,
  }),

  // Planeta 4 — cópia do 3 com 3 faixas a mais ao norte e 3 ao sul
  p4: Object.freeze({
    PLANET_RADIUS: 2.0,
    LON_SLICES: 44,
    BAND_HEIGHT: 0.145,
    LAT_BANDS: 13,
    SPAWN_BAND: 6,
    CAM_ALT: 6.8,
    PLAYER_MOVE_SPEED: 0.95,
    SPAWN_COL: 3,
    EXPLOSION_RADIUS_CELLS: 3,
  }),
});

export const PHASES = Object.freeze([
  { id: 'planeta-1', label: 'Planeta 1', unlocked: true, configKey: 'p1' },
  { id: 'planeta-2', label: 'Planeta 2', unlocked: true, configKey: 'p2' },
  { id: 'planeta-3', label: 'Planeta 3', unlocked: true, configKey: 'p3' },
  { id: 'planeta-4', label: 'Planeta 4', unlocked: true, configKey: 'p4' },
]);

export function getPhase(phaseId) {
  return PHASES.find((p) => p.id === phaseId) ?? null;
}

export function getPhaseConfig(phaseId) {
  const phase = getPhase(phaseId);
  if (!phase?.unlocked || !phase.configKey) return null;
  return PHASE_CONFIGS[phase.configKey] ?? null;
}

export function applyPhaseConfig(phaseId) {
  const overrides = getPhaseConfig(phaseId);
  if (!overrides) return false;
  applyConfigOverrides(overrides);
  return true;
}
