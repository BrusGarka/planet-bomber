import * as THREE from 'three';
import { CONFIG, bandLat } from '../config/gameConfig.js';

export function sphericalToCartesian(lat, lon, radius = CONFIG.PLANET_RADIUS) {
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lon),
  );
}

export function makeSurfaceMatrix(lat, lon) {
  const up = sphericalToCartesian(lat, lon).normalize();
  const north = new THREE.Vector3(
    -Math.sin(lat) * Math.cos(lon),
    Math.cos(lat),
    -Math.sin(lat) * Math.sin(lon),
  ).normalize();
  const east = new THREE.Vector3(
    -Math.cos(lat) * Math.sin(lon),
    0,
    Math.cos(lat) * Math.cos(lon),
  ).normalize();

  // RH: east × up = north → +X leste, +Y up, +Z norte (frente local = +Z)
  const matrix = new THREE.Matrix4();
  matrix.makeBasis(east, up, north);
  return matrix;
}

export function placeOnSurface(object3d, lat, lon, height = 0) {
  const pos = sphericalToCartesian(lat, lon, CONFIG.PLANET_RADIUS + height);
  object3d.position.copy(pos);
  object3d.quaternion.setFromRotationMatrix(makeSurfaceMatrix(lat, lon));
  object3d.quaternion.normalize();
}

export function normalizeLon(lon) {
  let value = lon;
  while (value < -Math.PI) value += 2 * Math.PI;
  while (value >= Math.PI) value -= 2 * Math.PI;
  return value;
}

export function lonDelta(a, b) {
  let delta = a - b;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

export function cellAt(lat, lon) {
  let band = -1;
  for (let i = 0; i < CONFIG.LAT_BANDS; i++) {
    const center = bandLat(i);
    const half = CONFIG.BAND_HEIGHT / 2;
    if (lat >= center - half && lat <= center + half) {
      band = i;
      break;
    }
  }
  if (band === -1) return null;

  const slice = (2 * Math.PI) / CONFIG.LON_SLICES;
  const lonN = normalizeLon(lon);
  let col = Math.floor((lonN + Math.PI) / slice);
  col = Math.max(0, Math.min(CONFIG.LON_SLICES - 1, col));
  return { band, col };
}

export function clampPlayableLat(lat) {
  const maxLat = bandLat(0) - CONFIG.BAND_HEIGHT / 2 - 0.02;
  const minLat = bandLat(CONFIG.LAT_BANDS - 1) + CONFIG.BAND_HEIGHT / 2 + 0.02;
  return Math.max(minLat, Math.min(maxLat, lat));
}
