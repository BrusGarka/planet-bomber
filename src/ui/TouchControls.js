/**
 * Controles touch para mobile/PWA.
 * D-pad WASD (norte/sul/leste/oeste absolutos) + botão de bomba.
 * Usa Pointer Events com captura para não perder o "keyup" ao arrastar.
 */
const DPAD = [
  { code: 'KeyW', label: 'N', cls: 'up' },
  { code: 'KeyA', label: 'O', cls: 'left' },
  { code: 'KeyD', label: 'L', cls: 'right' },
  { code: 'KeyS', label: 'S', cls: 'down' },
];

export class TouchControls {
  #root;
  #input;

  constructor(input) {
    this.#input = input;

    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.hidden = true;

    const pad = document.createElement('div');
    pad.className = 'touch-dpad';
    for (const { code, label, cls } of DPAD) {
      pad.appendChild(this.#makeButton(`touch-btn touch-dpad__btn touch-dpad__btn--${cls}`, label, code, true));
    }
    root.appendChild(pad);

    const actions = document.createElement('div');
    actions.className = 'touch-actions';
    actions.appendChild(this.#makeButton('touch-btn touch-btn--bomb', '💣', 'Space', false));
    root.appendChild(actions);

    document.body.appendChild(root);
    this.#root = root;
  }

  #makeButton(className, label, code, hold) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.setAttribute('aria-label', code);

    const press = (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('is-active');
      if (hold) this.#input.setKey(code, true);
      else this.#input.trigger(code);
    };
    const release = (e) => {
      e.preventDefault();
      btn.classList.remove('is-active');
      if (hold) this.#input.setKey(code, false);
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return btn;
  }

  show() {
    this.#root.hidden = false;
  }

  hide() {
    this.#root.hidden = true;
    for (const { code } of DPAD) this.#input.setKey(code, false);
  }
}
