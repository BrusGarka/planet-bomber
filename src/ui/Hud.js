import { CONFIG } from '../config/gameConfig.js';
import { cellAt } from '../math/spherical.js';

export class Hud {
  #statusEl = document.getElementById('status');
  #msgEl = document.getElementById('msg');
  #debugHint = document.getElementById('debug-hint');
  #hudEl = document.getElementById('hud');
  #debugOn = false;

  showGameplay() {
    this.#hudEl.hidden = false;
    this.#statusEl.hidden = false;
    if (this.#debugHint) this.#debugHint.hidden = false;
  }

  hideGameplay() {
    this.#hudEl.hidden = true;
    this.#statusEl.hidden = true;
    if (this.#debugHint) this.#debugHint.hidden = true;
    this.hideMessage();
  }

  setDebugGrid(on) {
    this.#debugOn = on;
    if (this.#debugHint) {
      this.#debugHint.textContent = on
        ? 'Debug grid ON · Faixa F1–F7 (N→S) · Coluna C1–Cn (lon) · célula F#C# · G desliga'
        : 'G = debug grid (faixas/colunas)';
      this.#debugHint.classList.toggle('on', on);
    }
  }

  setStatus({ band, col, bombs, debugGrid }) {
    if (typeof debugGrid === 'boolean') this.setDebugGrid(debugGrid);

    const cellId = band == null ? '—' : `F${band + 1}C${col + 1}`;
    this.#statusEl.textContent = band == null
      ? '—'
      : `${cellId} · Faixa ${band + 1}/${CONFIG.LAT_BANDS} · Coluna ${col + 1}/${CONFIG.LON_SLICES} · Bombas: ${bombs}`;
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
