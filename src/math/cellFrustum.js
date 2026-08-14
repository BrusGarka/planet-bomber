import * as THREE from 'three';
import { CONFIG, cellLatLonBounds } from '../config/gameConfig.js';

/**
 * Frustum radial da célula: trapézio esférico extrudado ao longo do raio.
 * Faces laterais coincidem com meridianos (leste/oeste) e paralelos (norte/sul).
 *
 * Vértices não são compartilhados entre faces → normal plana (bloco, não suave).
 */
export function createCellFrustumGeometry(band, col) {
  const { latN, latS, lonW, lonE } = cellLatLonBounds(band, col);
  const innerR = CONFIG.PLANET_RADIUS;
  const outerR = CONFIG.PLANET_RADIUS + CONFIG.BLOCK_SCALE;

  const nwI = sph(latN, lonW, innerR);
  const neI = sph(latN, lonE, innerR);
  const seI = sph(latS, lonE, innerR);
  const swI = sph(latS, lonW, innerR);
  const nwO = sph(latN, lonW, outerR);
  const neO = sph(latN, lonE, outerR);
  const seO = sph(latS, lonE, outerR);
  const swO = sph(latS, lonW, outerR);

  const positions = [];
  // Quad CCW visto de fora. Mundo com θ espelhado: leste/oeste invertidos vs. RHS geográfico.
  pushQuad(positions, swO, seO, neO, nwO); // topo
  pushQuad(positions, nwI, neI, seI, swI); // base
  pushQuad(positions, neI, nwI, nwO, neO); // norte
  pushQuad(positions, swI, seI, seO, swO); // sul
  pushQuad(positions, swI, swO, nwO, nwI); // oeste
  pushQuad(positions, neI, neO, seO, seI); // leste

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function sph(lat, lon, radius) {
  const cosLat = Math.cos(lat);
  return [
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * cosLat * Math.sin(lon),
  ];
}

function pushQuad(out, a, b, c, d) {
  out.push(...a, ...b, ...c, ...a, ...c, ...d);
}
