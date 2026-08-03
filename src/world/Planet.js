import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';
import { placeOnSurface, sphericalToCartesian } from '../math/spherical.js';

export class Planet {
  #mesh;

  constructor(scene) {
    const geometry = new THREE.SphereGeometry(CONFIG.PLANET_RADIUS, 64, 48);
    const material = new THREE.MeshStandardMaterial({
      color: 0xad8348,
      roughness: 0.92,
      metalness: 0,
    });
    this.#mesh = new THREE.Mesh(geometry, material);
    this.#mesh.receiveShadow = true;
    scene.add(this.#mesh);
    // Grama nos dois polos; bandeira só no Norte
    this.#addPoleDecor(scene, 1, true);
    this.#addPoleDecor(scene, -1, false);
  }

  get mesh() {
    return this.#mesh;
  }

  #addPoleDecor(scene, latSign, withFlag) {
    const lat = latSign * (Math.PI / 2 - 0.18);
    const ring = new THREE.Group();

    for (let i = 0; i < 10; i++) {
      const lon = (i / 10) * Math.PI * 2;
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.18, 5),
        new THREE.MeshStandardMaterial({ color: 0x4a9a3a, roughness: 0.9 }),
      );
      placeOnSurface(tuft, lat, lon, 0.02);
      ring.add(tuft);
    }

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6688, emissive: 0x441122, emissiveIntensity: 0.3 }),
    );
    placeOnSurface(flower, lat, 0, 0.12);
    ring.add(flower);

    if (withFlag) {
      const flag = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0xddddcc }),
      );
      pole.position.y = 0.18;
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xff4444 }),
      );
      cloth.position.set(0.09, 0.3, 0);
      flag.add(pole, cloth);
      const northLat = Math.PI / 2;
      flag.position.copy(sphericalToCartesian(northLat, 0, CONFIG.PLANET_RADIUS + 0.05));
      flag.quaternion.identity();
      ring.add(flag);
    }

    scene.add(ring);
  }
}
