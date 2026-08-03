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
 * Up = radial na câmera, Gram–Schmidt contra a visão.
 */
export class CameraSystem {
  #camera;
  #player;

  #normal = new THREE.Vector3();
  #forward = new THREE.Vector3();
  #east = new THREE.Vector3();
  #desiredDir = new THREE.Vector3();
  #currentDir = new THREE.Vector3();
  #camRadial = new THREE.Vector3();
  #viewDir = new THREE.Vector3();
  #up = new THREE.Vector3();
  #lookTarget = new THREE.Vector3();
  #tmp = new THREE.Vector3();

  #orbitRadius = CONFIG.PLANET_RADIUS + CONFIG.CAM_ALT;
  #hasDir = false;

  constructor(camera, player) {
    this.#camera = camera;
    this.#player = player;
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

    this.#camRadial.copy(this.#camera.position).normalize();
    this.#viewDir.subVectors(this.#lookTarget, this.#camera.position);
    const viewLen = this.#viewDir.length();
    if (viewLen > 1e-6) this.#viewDir.multiplyScalar(1 / viewLen);

    const d = this.#camRadial.dot(this.#viewDir);
    this.#up.copy(this.#camRadial).addScaledVector(this.#viewDir, -d);

    if (this.#up.lengthSq() < 1e-8) {
      this.#up.copy(this.#east);
      this.#tmp.copy(this.#viewDir).multiplyScalar(this.#up.dot(this.#viewDir));
      this.#up.sub(this.#tmp);
      if (this.#up.lengthSq() < 1e-8) this.#up.set(0, 1, 0);
    }
    this.#up.normalize();

    this.#camera.up.copy(this.#up);
    this.#camera.lookAt(this.#lookTarget);
  }
}
