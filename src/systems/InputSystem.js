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

  isDown(code) {
    return this.#keys.get(code) === true;
  }
}
