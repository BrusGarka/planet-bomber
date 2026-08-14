import { CONFIG } from '../config/gameConfig.js';
import {
  cellAt,
  clampPlayableLat,
  normalizeLon,
} from '../math/spherical.js';

/** Evita divisão por zero perto dos polos (playable band já está longe). */
const COS_LAT_EPS = 0.08;

/**
 * Fração máxima da célula usada como raio de espessura.
 * r < ½ da célula garante que um corredor de 1 célula (rua) permanece andável.
 */
const COLLIDE_CELL_FRACTION = 0.45;

/**
 * Movimento absoluto N/S/L/O com velocidade métrica na superfície.
 * PLAYER_MOVE_SPEED = radianos de arco / s no meridiano (v = ω·R).
 * dφ = n̂·ω·dt ; dθ = ê·ω·dt / cos(φ)
 *
 * Colisão: célula sólida ocupa 100% do retângulo (φ,θ). Espessura do jogador
 * é amostrada em 8 direções, com raio limitado para não fechar ruas estreitas.
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
    const lat0 = this.player.lat;
    const lon0 = this.player.lon;
    const newLat = clampPlayableLat(lat0 + dLat);
    const newLon = normalizeLon(lon0 + dLon);

    if (!this.#isBlocked(newLat, newLon)) {
      this.player.setPosition(newLat, newLon);
      return true;
    }

    // Desliza no eixo livre quando o passo diagonal/cheio bate no muro.
    let moved = false;
    const latOnly = clampPlayableLat(lat0 + dLat);
    if (!this.#isBlocked(latOnly, lon0)) {
      this.player.setPosition(latOnly, lon0);
      moved = true;
    }
    const lonOnly = normalizeLon(lon0 + dLon);
    if (!this.#isBlocked(this.player.lat, lonOnly)) {
      this.player.setPosition(this.player.lat, lonOnly);
      moved = true;
    }
    return moved;
  }

  #isBlocked(lat, lon) {
    if (this.#cellSolid(lat, lon)) return true;

    const R = CONFIG.PLANET_RADIUS;
    const cosLat = Math.max(Math.abs(Math.cos(lat)), COS_LAT_EPS);
    const cellLatM = CONFIG.BAND_HEIGHT * R;
    const cellLonM = (2 * Math.PI / CONFIG.LON_SLICES) * R * cosLat;
    const r = Math.min(
      CONFIG.PLAYER_COLLIDE_RADIUS,
      COLLIDE_CELL_FRACTION * Math.min(cellLatM, cellLonM),
    );
    const dAng = r / R;
    const dLon = dAng / cosLat;
    const diag = Math.SQRT1_2;

    return this.#cellSolid(lat + dAng, lon)
      || this.#cellSolid(lat - dAng, lon)
      || this.#cellSolid(lat, normalizeLon(lon + dLon))
      || this.#cellSolid(lat, normalizeLon(lon - dLon))
      || this.#cellSolid(lat + dAng * diag, normalizeLon(lon + dLon * diag))
      || this.#cellSolid(lat + dAng * diag, normalizeLon(lon - dLon * diag))
      || this.#cellSolid(lat - dAng * diag, normalizeLon(lon + dLon * diag))
      || this.#cellSolid(lat - dAng * diag, normalizeLon(lon - dLon * diag));
  }

  #cellSolid(lat, lon) {
    const cell = cellAt(lat, lon);
    if (!cell) return true;
    return this.grid.isSolid(this.grid.get(cell.band, cell.col));
  }
}
