/**
 * Controles touch para mobile/PWA.
 * Joystick analógico dinâmico (aparece onde o dedo toca na metade esquerda)
 * traduzido para WASD absolutos + botão de bomba.
 */
const DIRS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
const DEAD_ZONE = 12;
const MAX_RADIUS = 52;

export class TouchControls {
  #root;
  #input;
  #zone;
  #stick;
  #knob;
  #pointerId = null;
  #origin = { x: 0, y: 0 };

  constructor(input) {
    this.#input = input;

    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.hidden = true;

    const zone = document.createElement('div');
    zone.className = 'touch-zone';

    const stick = document.createElement('div');
    stick.className = 'touch-stick';
    stick.hidden = true;
    const knob = document.createElement('div');
    knob.className = 'touch-stick__knob';
    stick.appendChild(knob);
    zone.appendChild(stick);
    root.appendChild(zone);

    const actions = document.createElement('div');
    actions.className = 'touch-actions';
    actions.appendChild(this.#makeBomb());
    root.appendChild(actions);

    document.body.appendChild(root);
    this.#root = root;
    this.#zone = zone;
    this.#stick = stick;
    this.#knob = knob;

    zone.addEventListener('pointerdown', (e) => this.#onDown(e));
    zone.addEventListener('pointermove', (e) => this.#onMove(e));
    zone.addEventListener('pointerup', (e) => this.#onUp(e));
    zone.addEventListener('pointercancel', (e) => this.#onUp(e));
    zone.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  #onDown(e) {
    if (this.#pointerId !== null) return;
    e.preventDefault();
    this.#pointerId = e.pointerId;
    this.#zone.setPointerCapture?.(e.pointerId);
    this.#origin = { x: e.clientX, y: e.clientY };
    const rect = this.#zone.getBoundingClientRect();
    this.#stick.style.left = `${e.clientX - rect.left}px`;
    this.#stick.style.top = `${e.clientY - rect.top}px`;
    this.#stick.hidden = false;
    this.#knob.style.transform = 'translate(-50%, -50%)';
  }

  #onMove(e) {
    if (e.pointerId !== this.#pointerId) return;
    e.preventDefault();
    let dx = e.clientX - this.#origin.x;
    let dy = e.clientY - this.#origin.y;
    const len = Math.hypot(dx, dy);
    if (len > MAX_RADIUS) {
      dx = (dx / len) * MAX_RADIUS;
      dy = (dy / len) * MAX_RADIUS;
    }
    this.#knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    if (len < DEAD_ZONE) {
      this.#clearKeys();
      return;
    }
    // direção dominante (movimento em grade)
    const horizontal = Math.abs(dx) > Math.abs(dy);
    this.#input.setKey('KeyW', !horizontal && dy < 0);
    this.#input.setKey('KeyS', !horizontal && dy > 0);
    this.#input.setKey('KeyA', horizontal && dx < 0);
    this.#input.setKey('KeyD', horizontal && dx > 0);
  }

  #onUp(e) {
    if (e.pointerId !== this.#pointerId) return;
    e.preventDefault();
    this.#pointerId = null;
    this.#stick.hidden = true;
    this.#clearKeys();
  }

  #clearKeys() {
    for (const code of DIRS) this.#input.setKey(code, false);
  }

  #makeBomb() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'touch-btn touch-btn--bomb';
    btn.textContent = '💣';
    btn.setAttribute('aria-label', 'Bomba');
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('is-active');
      this.#input.trigger('Space');
    });
    const off = (e) => {
      e.preventDefault();
      btn.classList.remove('is-active');
    };
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return btn;
  }

  show() {
    this.#root.hidden = false;
  }

  hide() {
    this.#root.hidden = true;
    this.#pointerId = null;
    this.#stick.hidden = true;
    this.#clearKeys();
  }
}
