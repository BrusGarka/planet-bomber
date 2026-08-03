import { GameState } from '../config/gameConfig.js';

export class GameStateMachine {
  #state = GameState.PLAYING;
  #listeners = new Map();

  get state() {
    return this.#state;
  }

  is(state) {
    return this.#state === state;
  }

  isPlaying() {
    return this.#state === GameState.PLAYING;
  }

  transition(next) {
    if (this.#state === next) return;
    const prev = this.#state;
    this.#state = next;
    for (const fn of this.#listeners.get(next) ?? []) fn(prev, next);
  }

  on(state, fn) {
    if (!this.#listeners.has(state)) this.#listeners.set(state, new Set());
    this.#listeners.get(state).add(fn);
    return () => this.#listeners.get(state).delete(fn);
  }
}
