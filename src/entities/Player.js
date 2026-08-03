import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';
import { placeOnSurface } from '../math/spherical.js';

export class Player {
  #group;
  #body;
  #head;
  #lat;
  #lon;

  constructor(scene, spawn) {
    this.#lat = spawn.lat;
    this.#lon = spawn.lon;

    this.#group = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x2a5fd4, roughness: 0.45, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d8, roughness: 0.55 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.25, metalness: 0.05 });

    this.#body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 12), suitMat);
    this.#body.position.y = 0.02;
    this.#body.castShadow = true;
    this.#group.add(this.#body);

    this.#head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), helmetMat);
    this.#head.position.y = 0.22;
    this.#head.castShadow = true;
    this.#group.add(this.#head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.055, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.2, metalness: 0.4 }),
    );
    visor.position.set(0, 0.22, 0.1);
    this.#group.add(visor);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
    hand.position.set(0.15, 0.06, 0.08);
    this.#group.add(hand);

    scene.add(this.#group);
    this.syncTransform();
  }

  get mesh() {
    return this.#group;
  }

  get lat() {
    return this.#lat;
  }

  get lon() {
    return this.#lon;
  }

  setPosition(lat, lon) {
    this.#lat = lat;
    this.#lon = lon;
  }

  reset(spawn) {
    this.#lat = spawn.lat;
    this.#lon = spawn.lon;
    this.#head.material.color.set(0xf5f5f5);
    this.#body.material.color.set(0x2a5fd4);
    this.syncTransform();
  }

  markDead() {
    this.#head.material.color.set(0x886666);
    this.#body.material.color.set(0x553333);
  }

  syncTransform() {
    placeOnSurface(this.#group, this.#lat, this.#lon, CONFIG.PLAYER_FLOAT);
  }
}
