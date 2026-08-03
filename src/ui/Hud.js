import { CONFIG } from '../config/gameConfig.js';
import { cellAt } from '../math/spherical.js';

export class Hud {
  #statusEl = document.getElementById('status');
  #msgEl = document.getElementById('msg');

  setStatus({ band, col, bombs }) {
    this.#statusEl.textContent = band == null
      ? '—'
      : `Faixa ${band + 1}/${CONFIG.LAT_BANDS} · Coluna ${col + 1}/${CONFIG.LON_SLICES} · Bombas: ${bombs}`;
  }

  showMessage(title, subtitle = '') {
    this.#msgEl.innerHTML = title + (subtitle ? `<small>${subtitle}</small>` : '');
    this.#msgEl.style.display = 'block';
  }

  hideMessage() {
    this.#msgEl.style.display = 'none';
  }
}

export function readPlayerCell(player) {
  const cell = cellAt(player.lat, player.lon);
  return cell ? { band: cell.band, col: cell.col } : { band: null, col: null };
}
