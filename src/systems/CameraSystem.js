import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';

/**
 * Slerp entre duas direções unitárias (Three.Vector3 não tem slerp).
 * Resultado escrito em `out` (pode ser o mesmo que `from`).
 */
function slerpUnit(from, to, t, out) {
  let dot = from.dot(to);
  dot = Math.max(-1, Math.min(1, dot));

  if (dot > 0.9995) {
    out.copy(from).lerp(to, t).normalize();
    return out;
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  const a = Math.sin((1 - t) * theta) / sinTheta;
  const b = Math.sin(t * theta) / sinTheta;
  out.copy(from).multiplyScalar(a).addScaledVector(to, b).normalize();
  return out;
}

/**
 * Câmera satélite do jogador.
 *
 * Órbita de raio R+alt. Posição via Rodrigues (atrás + elevação).
 * Suavização: slerp na direção unitária (mantém altitude orbital).
 * Direita da tela alinhada ao leste geográfico (A/D absolutos corretos).
 */
export class CameraSystem {
  #camera;
  #player;

  #normal = new THREE.Vector3();
  #forward = new THREE.Vector3();
  #east = new THREE.Vector3();
  #desiredDir = new THREE.Vector3();
  #currentDir = new THREE.Vector3();
  #viewDir = new THREE.Vector3();
  #up = new THREE.Vector3();
  #lookTarget = new THREE.Vector3();
  #tmp = new THREE.Vector3();
  #right = new THREE.Vector3();
  #back = new THREE.Vector3();

  #orbitRadius = CONFIG.PLANET_RADIUS + CONFIG.CAM_ALT;
  #hasDir = false;

  constructor(camera, player) {
    this.#camera = camera;
    this.#player = player;
    // Matriz manual: +X = leste ⇒ D = direita da tela
    this.#camera.matrixAutoUpdate = false;
  }

  update(dt, snap = false) {
    const playerPos = this.#player.mesh.position;
    const q = this.#player.mesh.quaternion;

    this.#normal.copy(playerPos).normalize();
    // Frente local = norte = +Z do frame RH (east, up, north)
    this.#forward.set(0, 0, 1).applyQuaternion(q);
    this.#east.set(1, 0, 0).applyQuaternion(q);

    // Rodrigues: normal → atrás (sul = -forward). east×up = north = forward
    // ângulo negativo em torno do leste move up → -north (atrás)
    this.#desiredDir.copy(this.#normal);
    this.#desiredDir.applyAxisAngle(this.#east, -CONFIG.CAM_ANGULAR_BACK);

    this.#tmp.crossVectors(this.#desiredDir, this.#east);
    if (this.#tmp.lengthSq() > 1e-8) {
      this.#tmp.normalize();
      this.#desiredDir.applyAxisAngle(this.#tmp, -CONFIG.CAM_ANGULAR_ELEV);
    }
    this.#desiredDir.normalize();

    // Slerp na esfera unitária → depois escala pelo raio orbital
    if (snap || !this.#hasDir) {
      this.#currentDir.copy(this.#desiredDir);
      this.#hasDir = true;
    } else {
      const alpha = 1 - Math.exp(-CONFIG.CAM_FOLLOW * dt);
      slerpUnit(this.#currentDir, this.#desiredDir, alpha, this.#currentDir);
    }

    this.#camera.position.copy(this.#currentDir).multiplyScalar(this.#orbitRadius);

    this.#lookTarget
      .copy(playerPos)
      .addScaledVector(this.#forward, CONFIG.CAM_LOOK_AHEAD)
      .addScaledVector(this.#normal, -CONFIG.CAM_LOOK_DOWN);

    // Base da câmera (Three.js): +X direita, +Y up, +Z atrás
    // Forçamos +X = leste projetado ⇒ D (leste) = direita da tela
    this.#viewDir.subVectors(this.#lookTarget, this.#camera.position);
    const viewLen = this.#viewDir.length();
    if (viewLen > 1e-6) this.#viewDir.multiplyScalar(1 / viewLen);

    this.#back.copy(this.#viewDir).negate(); // +Z câmera = oposto ao look

    this.#right.copy(this.#east);
    this.#right.addScaledVector(this.#back, -this.#right.dot(this.#back));
    if (this.#right.lengthSq() < 1e-8) {
      this.#right.crossVectors(this.#normal, this.#back);
    }
    this.#right.normalize();

    this.#up.crossVectors(this.#back, this.#right).normalize();

    this.#camera.matrix.makeBasis(this.#right, this.#up, this.#back);
    this.#camera.matrix.setPosition(this.#camera.position);
    this.#camera.matrixWorldNeedsUpdate = true;
  }
}
