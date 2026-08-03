import * as THREE from 'three';
import { CONFIG } from '../config/gameConfig.js';

export function createRendererBundle() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08051a);
  scene.fog = new THREE.FogExp2(0x08051a, 0.016);

  const camera = new THREE.PerspectiveCamera(
    CONFIG.FOV,
    window.innerWidth / window.innerHeight,
    0.05,
    120,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, onResize };
}
