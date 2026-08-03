import * as THREE from 'three';

export function createSceneEnvironment(scene) {
  const ambient = new THREE.AmbientLight(0xc8b8e8, 0.9);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xfff0d8, 0x3a2a18, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4dc, 2.2);
  sun.position.set(8, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);
  scene.add(sun.target);

  addStars(scene);
  addNebula(scene);
  addMoon(scene);
  addUfo(scene);

  return { sun, planetTarget: new THREE.Vector3() };
}

function addStars(scene) {
  const geometry = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 55 + Math.random() * 35;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;
    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.cos(theta);
    positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xb8c8ff, size: 0.35, sizeAttenuation: true }),
  ));
}

function addNebula(scene) {
  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(48, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x4a2088, transparent: true, opacity: 0.12, side: THREE.BackSide }),
  );
  nebula.position.set(-8, 4, -12);
  scene.add(nebula);
}

function addMoon(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.9, emissive: 0x221a10, emissiveIntensity: 0.15 }),
  );
  moon.position.set(-7, 5, -6);
  scene.add(moon);
}

function addUfo(scene) {
  const ufo = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.55, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x88aacc, metalness: 0.6, roughness: 0.3 }),
  );
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.75 }),
  );
  dome.position.y = 0.08;
  ufo.add(disc, dome);
  ufo.position.set(6, 7, -5);
  ufo.rotation.z = 0.3;
  scene.add(ufo);
}
