import { PHASES } from '../config/phases.js';

export class PhaseSelect {
  #root;
  #onSelect;

  constructor(onSelect) {
    this.#onSelect = onSelect;
    this.#root = document.getElementById('phase-select');
    this.#render();
  }

  #render() {
    this.#root.innerHTML = `
      <div class="phase-select__panel">
        <h1 class="phase-select__title">Planeta Galaxy Bomberman</h1>
        <p class="phase-select__subtitle">Escolha um planeta</p>
        <div class="phase-select__grid">
          ${PHASES.map((phase) => this.#cardHtml(phase)).join('')}
        </div>
      </div>
    `;

    this.#root.querySelectorAll('[data-phase-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this.#onSelect(btn.dataset.phaseId);
      });
    });
  }

  #cardHtml(phase) {
    const locked = !phase.unlocked;
    return `
      <button
        type="button"
        class="phase-card${locked ? ' phase-card--locked' : ' phase-card--unlocked'}"
        data-phase-id="${phase.id}"
        ${locked ? 'disabled' : ''}
        aria-label="${phase.label}${locked ? ' (em breve)' : ''}"
      >
        <span class="phase-card__label">${phase.label}</span>
        ${locked ? '<span class="phase-card__badge">Em breve</span>' : '<span class="phase-card__badge phase-card__badge--play">Jogar</span>'}
      </button>
    `;
  }

  show() {
    this.#root.style.display = 'flex';
  }

  hide() {
    this.#root.style.display = 'none';
  }
}
