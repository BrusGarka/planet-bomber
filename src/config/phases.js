import { CONFIG, BAND_LAYOUT } from './gameConfig.js';

export const PHASES = Object.freeze([
  { id: 'planeta-1', label: 'Planeta 1', unlocked: true, configKey: 'default' },
  { id: 'planeta-2', label: 'Planeta 2', unlocked: true, configKey: 'default' },
  { id: 'planeta-3', label: 'Planeta 3', unlocked: false, configKey: null },
  { id: 'planeta-4', label: 'Planeta 4', unlocked: false, configKey: null },
]);

const PHASE_CONFIGS = Object.freeze({
  default: Object.freeze({ config: CONFIG, bandLayout: BAND_LAYOUT }),
});

export function getPhase(phaseId) {
  return PHASES.find((p) => p.id === phaseId) ?? null;
}

export function getPhaseConfig(phaseId) {
  const phase = getPhase(phaseId);
  if (!phase?.unlocked || !phase.configKey) return null;
  return PHASE_CONFIGS[phase.configKey] ?? null;
}
