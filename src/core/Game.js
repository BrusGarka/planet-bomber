import * as THREE from 'three';
import { GameState, CONFIG } from '../config/gameConfig.js';
import { getPhase, applyPhaseConfig } from '../config/phases.js';
import { GameStateMachine } from './GameStateMachine.js';
import { createRendererBundle } from '../scene/RendererSetup.js';
import { createSceneEnvironment } from '../world/SceneEnvironment.js';
import { Planet } from '../world/Planet.js';
import { Grid } from '../world/Grid.js';
import { BlockManager } from '../world/BlockManager.js';
import { Player } from '../entities/Player.js';
import { BombSystem } from '../entities/BombSystem.js';
import { ExplosionSystem } from '../entities/ExplosionSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { Hud, readPlayerCell } from '../ui/Hud.js';
import { PhaseSelect } from '../ui/PhaseSelect.js';
import { GridDebugOverlay } from '../world/GridDebugOverlay.js';

export class Game {
  #stateMachine = new GameStateMachine();
  #rendererBundle;
  #environment;
  #planet;
  #grid;
  #blocks;
  #player;
  #input;
  #movement;
  #camera;
  #explosions;
  #bombs;
  #hud;
  #phaseSelect;
  #gridDebug;
  #selectedPhase = null;
  #lastTime = performance.now();
  #yAxis = new THREE.Vector3(0, 1, 0);

  constructor() {
    this.#rendererBundle = createRendererBundle();
    const { scene, renderer } = this.#rendererBundle;

    this.#environment = createSceneEnvironment(scene);
    this.#planet = new Planet(scene);
    this.#grid = new Grid();
    this.#blocks = new BlockManager(scene, this.#grid);
    this.#player = new Player(scene, this.#grid.getSpawnPosition());
    this.#input = new InputSystem();
    this.#movement = new MovementSystem(this.#player, this.#grid);
    this.#camera = new CameraSystem(this.#rendererBundle.camera, this.#player);
    this.#explosions = new ExplosionSystem(scene);
    this.#bombs = new BombSystem(
      scene,
      this.#grid,
      this.#blocks,
      this.#explosions,
      () => this.#onPlayerHit(),
    );
    this.#hud = new Hud(() => this.#enterMenu());
    this.#gridDebug = new GridDebugOverlay(scene);
    this.#phaseSelect = new PhaseSelect((phaseId) => this.startPhase(phaseId));

    this.#bindInput();
    this.#bindStateHandlers();
    this.#enterMenu();
    renderer.domElement.style.display = 'none';
    this.#loop();
  }

  #enterMenu() {
    this.#selectedPhase = null;
    this.#stateMachine.transition(GameState.MENU);
    this.#hud.hideGameplay();
    this.#phaseSelect.show();
    this.#rendererBundle.renderer.domElement.style.display = 'none';
  }

  startPhase(phaseId) {
    const phase = getPhase(phaseId);
    if (!phase?.unlocked) return;
    if (!applyPhaseConfig(phaseId)) return;

    this.#selectedPhase = phaseId;
    this.#planet.rebuild();
    this.#gridDebug.rebuild();
    this.#phaseSelect.hide();
    this.#rendererBundle.renderer.domElement.style.display = '';
    this.#hud.showGameplay();
    this.reset();
  }

  #bindInput() {
    this.#input.bind('Space', () => {
      if (this.#stateMachine.isPlaying()) this.#bombs.tryDrop(this.#player);
    });
    this.#input.bind('KeyR', () => {
      if (this.#stateMachine.is(GameState.DEAD)) this.reset();
    });
    this.#input.bind('Escape', () => {
      if (!this.#stateMachine.isMenu()) this.#enterMenu();
    });
    this.#input.bind('KeyG', () => {
      if (this.#stateMachine.isMenu()) return;
      const on = this.#gridDebug.toggle();
      this.#hud.setDebugGrid(on);
    });
  }

  #bindStateHandlers() {
    this.#stateMachine.on(GameState.DEAD, () => {
      this.#player.markDead();
      this.#hud.showMessage('Você foi atingido!', 'Pressione R para reiniciar');
    });
  }

  #onPlayerHit() {
    if (!this.#stateMachine.isPlaying()) return;
    this.#stateMachine.transition(GameState.DEAD);
  }

  reset() {
    if (!this.#selectedPhase) return;
    this.#bombs.clear();
    this.#explosions.clear();
    this.#grid.regenerate();
    this.#blocks.rebuild();
    this.#player.reset(this.#grid.getSpawnPosition());
    this.#stateMachine.transition(GameState.PLAYING);
    this.#camera.update(0, true);
    this.#hud.hideMessage();
  }

  #update(dt) {
    if (this.#stateMachine.isMenu()) return;

    const now = performance.now();

    this.#movement.update(dt, this.#input, this.#stateMachine.isPlaying());
    this.#bombs.update(now, this.#player);
    this.#explosions.update(now);

    this.#environment.sun.position.applyAxisAngle(this.#yAxis, dt * 0.02);
    this.#environment.sun.target.position.copy(this.#planet.mesh.position);

    this.#camera.update(dt);
    this.#gridDebug.update(this.#rendererBundle.camera);

    const cell = readPlayerCell(this.#player);
    this.#hud.setStatus({
      ...cell,
      bombs: this.#bombs.count,
      debugGrid: this.#gridDebug.enabled,
    });
  }

  #render() {
    if (this.#stateMachine.isMenu()) return;
    const { renderer, scene, camera } = this.#rendererBundle;
    renderer.render(scene, camera);
  }

  #loop() {
    requestAnimationFrame(() => this.#loop());
    const now = performance.now();
    const dt = Math.min(CONFIG.MAX_DT, (now - this.#lastTime) / 1000);
    this.#lastTime = now;
    this.#update(dt);
    this.#render();
  }
}
