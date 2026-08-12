export class InputSystem {
  #keys = new Map();
  #actions = new Map();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.#keys.set(e.code, true);
      const action = this.#actions.get(e.code);
      if (action) {
        e.preventDefault();
        action();
      }
    });
    window.addEventListener('keyup', (e) => this.#keys.set(e.code, false));
  }

  bind(code, action) {
    this.#actions.set(code, action);
  }

  /** Estado sustentado (usado pelos botões touch do d-pad). */
  setKey(code, down) {
    this.#keys.set(code, down === true);
  }

  /** Dispara uma ação pontual (bomba, menu…) sem teclado. */
  trigger(code) {
    this.#actions.get(code)?.();
  }

  isDown(code) {
    return this.#keys.get(code) === true;
  }
}
