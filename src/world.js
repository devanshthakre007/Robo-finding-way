/**
 * World prop builders — our own procedural models.
 * Tree + rock are ported from actorowebapp-main assetBuilders.js (smooth style);
 * flowers, clouds and the path are original additions tuned for the pastel scene.
 */

import * as THREE from "three";

const SEG = (low) => {
  if (low <= 4) return 16;
  if (low <= 8) return 24;
  return Math.min(48, low * 3);
};

function surfaceMaterial(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.04,
    ...opts,
  });
}

function mesh(geo, color, opts) {
  const m = new THREE.Mesh(geo, surfaceMaterial(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const sph = (r, s = 8) => new THREE.SphereGeometry(r, SEG(s), SEG(s));
const cyl = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, SEG(s));
const cone = (r, h, s = 8) => new THREE.ConeGeometry(r, h, SEG(s));

function shadowAll(group) {
  group.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

/** Rounded or conical tree (ported from Actoro buildTree). */
export function buildTree({
  trunkColor = 0x6d4c41,
  leafColor = 0x81c784,
  conical = false,
  height = 1.0,
} = {}) {
  const g = new THREE.Group();

  const trunk = mesh(cyl(0.18, 0.25, 1.2 * height, 8), trunkColor);
  trunk.position.y = 0.6 * height;
  g.add(trunk);

  if (conical) {
    for (let i = 0; i < 3; i++) {
      const tier = mesh(cone(0.85 - i * 0.18, 0.9 * height, 8), leafColor);
      tier.position.y = 1.2 * height + i * 0.55 * height;
      g.add(tier);
    }
  } else {
    const canopy = mesh(sph(0.9 * height, 8), leafColor);
    canopy.scale.y = 0.9;
    canopy.position.y = 2.1 * height;
    g.add(canopy);

    const canopy2 = mesh(sph(0.6 * height, 8), leafColor);
    canopy2.position.set(0.4, 2.5 * height, 0);
    g.add(canopy2);
  }

  return shadowAll(g);
}

/** Clustered rock (ported from Actoro buildRock). */
export function buildRock({ color = 0x9fb0bd, size = 1.0 } = {}) {
  const g = new THREE.Group();
  const s = size;

  const r1 = mesh(sph(0.5 * s, 7), color);
  r1.position.y = 0.3 * s;
  r1.scale.set(1, 0.75, 0.95);
  g.add(r1);

  const r2 = mesh(sph(0.3 * s, 7), color);
  r2.position.set(0.3 * s, 0.45 * s, 0.1 * s);
  g.add(r2);

  const r3 = mesh(sph(0.22 * s, 7), color);
  r3.position.set(-0.28 * s, 0.3 * s, 0.2 * s);
  g.add(r3);

  return shadowAll(g);
}

/** A small flower tuft — original. */
export function buildFlower({ petalColor = 0xf48fb1 } = {}) {
  const g = new THREE.Group();

  const stem = mesh(cyl(0.015, 0.02, 0.3, 5), 0x66bb6a);
  stem.position.y = 0.15;
  g.add(stem);

  const center = mesh(sph(0.05, 6), 0xfff176);
  center.position.y = 0.32;
  g.add(center);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = mesh(sph(0.05, 6), petalColor);
    petal.scale.set(1, 0.5, 1);
    petal.position.set(Math.cos(a) * 0.08, 0.32, Math.sin(a) * 0.08);
    g.add(petal);
  }

  return shadowAll(g);
}

/** A soft puffy cloud — original. Returned meshes are unlit-ish (no shadows). */
export function buildCloud({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.92,
  });
  const puff = (r, x, y, z) => {
    const m = new THREE.Mesh(sph(r, 8), mat);
    m.position.set(x, y, z);
    g.add(m);
  };
  puff(0.7, 0, 0, 0);
  puff(0.55, 0.7, -0.1, 0.1);
  puff(0.5, -0.65, -0.05, -0.1);
  puff(0.45, 0.2, 0.25, 0);
  g.scale.setScalar(scale);
  return g;
}

/** Wooden signpost (ported from Actoro buildSignpost). */
export function buildSignpost() {
  const g = new THREE.Group();

  const post = mesh(cyl(0.06, 0.06, 1.4, 6), 0x6d4c41);
  post.position.y = 0.7;
  g.add(post);

  const sign = mesh(box(0.8, 0.35, 0.07), 0xc8a27a);
  sign.position.y = 1.35;
  sign.rotation.y = -0.25;
  g.add(sign);

  return shadowAll(g);
}

/**
 * A flat winding trail the hero follows, drawn as overlapping discs sampled
 * along the waypoints. Discs lie flat on the ground so orientation is always
 * correct regardless of direction.
 */
export function buildPath(points, { width = 1.2, color = 0xe6dcc4, spacing = 0.35 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
  });
  const disc = new THREE.CircleGeometry(width / 2, 18);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.round(len / spacing));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const m = new THREE.Mesh(disc, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(a.x + dx * t, 0.012, a.z + dz * t);
      m.receiveShadow = true;
      g.add(m);
    }
  }

  return g;
}
