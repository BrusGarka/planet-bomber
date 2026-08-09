import { CONFIG, CellType, cellCenterLat, cellCenterLon } from '../config/gameConfig.js';
import {
  cellAt,
  clampPlayableLat,
  lonDelta,
  normalizeLon,
} from '../math/spherical.js';

/** Evita divisão por zero perto dos polos (playable band já está longe). */
const COS_LAT_EPS = 0.08;

/**
 * Movimento absoluto N/S/L/O com velocidade métrica na superfície.
 * PLAYER_MOVE_SPEED = radianos de arco / s no meridiano (v = ω·R).
 * dφ = n̂·ω·dt ; dθ = ê·ω·dt / cos(φ)
 */
export class MovementSystem {
  constructor(player, grid) {
    this.player = player;
    this.grid = grid;
  }

  update(dt, input, canMove) {
    if (!canMove) return;

    let north = 0;
    let east = 0;
    if (input.isDown('KeyW')) north += 1;
    if (input.isDown('KeyS')) north -= 1;
    if (input.isDown('KeyA')) east -= 1;
    if (input.isDown('KeyD')) east += 1;

    const lenSq = north * north + east * east;
    if (lenSq < 1e-8) return;

    // Normaliza diagonal (evita √2)
    let nHat = north;
    let eHat = east;
    if (lenSq > 1) {
      const inv = 1 / Math.sqrt(lenSq);
      nHat *= inv;
      eHat *= inv;
    }

    const arc = CONFIG.PLAYER_MOVE_SPEED * dt;
    const cosLat = Math.max(Math.abs(Math.cos(this.player.lat)), COS_LAT_EPS);

    const dLat = nHat * arc;
    const dLon = (eHat * arc) / cosLat;

    if (this.#tryMove(dLat, dLon)) this.player.syncTransform();
  }

  #tryMove(dLat, dLon) {
    const newLat = clampPlayableLat(this.player.lat + dLat);
    const newLon = normalizeLon(this.player.lon + dLon);
    if (this.#isBlocked(newLat, newLon)) return false;
    this.player.setPosition(newLat, newLon);
    return true;
  }

  #isBlocked(lat, lon) {
    const cell = cellAt(lat, lon);
    if (!cell) return true;
    if (this.grid.get(cell.band, cell.col) === CellType.EMPTY) return false;

    const cLat = cellCenterLat(cell.band);
    const cLon = cellCenterLon(cell.col);
    const R = CONFIG.PLANET_RADIUS;
    const cosLat = Math.max(Math.abs(Math.cos(cLat)), COS_LAT_EPS);

    // Caixa de colisão em unidades de mundo: tamanho real do bloco + raio do jogador.
    // Limitada a COLLISION_MARGIN da célula para nunca fechar corredores em grids densos.
    const box = CONFIG.BLOCK_SCALE / 2 + CONFIG.PLAYER_COLLIDE_RADIUS;
    const cellHalfLat = (CONFIG.BAND_HEIGHT / 2) * R;
    const cellHalfLon = (Math.PI / CONFIG.LON_SLICES) * R * cosLat;
    const halfLat = Math.min(box, cellHalfLat * CONFIG.COLLISION_MARGIN);
    const halfLon = Math.min(box, cellHalfLon * CONFIG.COLLISION_MARGIN);

    const inLat = Math.abs(lat - cLat) * R < halfLat;
    const inLon = Math.abs(lonDelta(lon, cLon)) * R * cosLat < halfLon;
    return inLat && inLon;
  }
}

