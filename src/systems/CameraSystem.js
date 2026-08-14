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
 * Câmera satélite no meridiano geográfico do jogador.
 *
 * Posição: normal × Rodrigues em torno do *leste geográfico* (atrás = sul).
 * Fica no plano O–PoloNorte–jogador.
 *
 * lookAt(origem): o disco do planeta fica centrado na tela (margens L–R iguais).
 * Up = Polo Norte → meridiano N–S vertical; jogador na metade superior.
 */
export class CameraSystem {
  #camera;
  #player;

  #normal = new THREE.Vector3();
  #east = new THREE.Vector3();
  #desiredDir = new THREE.Vector3();
  #currentDir = new THREE.Vector3();
  #viewDir = new THREE.Vector3();
  #up = new THREE.Vector3();
  #northPole = new THREE.Vector3(0, 1, 0);
  #origin = new THREE.Vector3(0, 0, 0);

  #hasDir = false;

  get #orbitRadius() {
    return CONFIG.PLANET_RADIUS + CONFIG.CAM_ALT;
  }

  constructor(camera, player) {
    this.#camera = camera;
    this.#player = player;
  }

  update(dt, snap = false) {
    const lat = this.#player.lat;
    const lon = this.#player.lon;

    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const cosLon = Math.cos(lon);
    const sinLon = Math.sin(lon);

    this.#normal.set(cosLat * cosLon, sinLat, -cosLat * sinLon).normalize();
    this.#east.set(-Math.sin(lon), 0, -Math.cos(lon)).normalize();


    this.#desiredDir.copy(this.#normal);
    this.#desiredDir.applyAxisAngle(this.#east, -CONFIG.CAM_ANGULAR_BACK);
    this.#desiredDir.normalize();

    if (snap || !this.#hasDir) {
      this.#currentDir.copy(this.#desiredDir);
      this.#hasDir = true;
    } else {
      const alpha = 1 - Math.exp(-CONFIG.CAM_FOLLOW * dt);
      slerpUnit(this.#currentDir, this.#desiredDir, alpha, this.#currentDir);
    }

    this.#camera.position.copy(this.#currentDir).multiplyScalar(this.#orbitRadius);

    this.#viewDir.copy(this.#origin).sub(this.#camera.position).normalize();

    this.#up.copy(this.#northPole);
    this.#up.addScaledVector(this.#viewDir, -this.#up.dot(this.#viewDir));
    if (this.#up.lengthSq() < 1e-8) {
      this.#up.set(0, 0, 1);
      this.#up.addScaledVector(this.#viewDir, -this.#up.dot(this.#viewDir));
    }
    this.#up.normalize();

    this.#camera.up.copy(this.#up);
    this.#camera.lookAt(this.#origin);
  }
}
