/**
 * Blocky humanoid from actorowebapp-main (AssetLibrary / assetBuilders.js).
 * Smooth style — rounded meshes + MeshStandardMaterial.
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
    roughness: 0.62,
    metalness: 0.06,
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

/**
 * @param {object} cfg — same options as actorowebapp buildHumanoid
 */
export function buildHumanoid({
  skinColor = 0xf5cba7,
  shirtColor = 0x3498db,
  pantsColor = 0x2c3e50,
  hairColor = 0x4a2800,
  shoeColor = 0x2c1810,
  eyeColor = 0x1a1a2e,
  scale = 1.0,
  hatColor = null,
  capeColor = null,
  armorColor = null,
} = {}) {
  const g = new THREE.Group();
  const bodyMat = armorColor || shirtColor;

  const shoeGeo = cyl(0.11, 0.12, 0.13, 12);
  const lShoe = mesh(shoeGeo, shoeColor);
  lShoe.position.set(-0.13, 0.07, 0.03);
  const rShoe = mesh(shoeGeo, shoeColor);
  rShoe.position.set(0.13, 0.07, 0.03);
  g.add(lShoe, rShoe);

  const legGeo = cyl(0.1, 0.1, 0.62, 16);
  const lLeg = mesh(legGeo, pantsColor);
  lLeg.position.set(-0.13, 0.44, 0);
  const rLeg = mesh(legGeo, pantsColor);
  rLeg.position.set(0.13, 0.44, 0);
  g.add(lLeg, rLeg);

  const torso = mesh(cyl(0.26, 0.24, 0.65, 16), bodyMat);
  torso.position.y = 1.0;
  g.add(torso);

  const armGeo = cyl(0.09, 0.09, 0.55, 14);
  const lArm = mesh(armGeo, bodyMat);
  lArm.position.set(-0.34, 0.96, 0);
  const rArm = mesh(armGeo, bodyMat);
  rArm.position.set(0.34, 0.96, 0);
  g.add(lArm, rArm);

  const handGeo = sph(0.1, 12);
  const lHand = mesh(handGeo, skinColor);
  lHand.position.set(-0.34, 0.65, 0);
  const rHand = mesh(handGeo, skinColor);
  rHand.position.set(0.34, 0.65, 0);
  g.add(lHand, rHand);

  const head = mesh(sph(0.22, 24), skinColor);
  head.position.y = 1.56;
  g.add(head);

  const eyeGeo = sph(0.04, 10);
  const lEye = mesh(eyeGeo, eyeColor);
  lEye.position.set(-0.1, 1.58, 0.2);
  const rEye = mesh(eyeGeo, eyeColor);
  rEye.position.set(0.1, 1.58, 0.2);
  g.add(lEye, rEye);

  const hair = mesh(sph(0.24, 20), hairColor);
  hair.scale.set(1, 0.55, 1);
  hair.position.y = 1.72;
  g.add(hair);

  if (hatColor !== null) {
    const hatBrim = mesh(cyl(0.38, 0.38, 0.06, 12), hatColor);
    hatBrim.position.y = 1.87;
    const hatTop = mesh(cyl(0.22, 0.22, 0.42, 12), hatColor);
    hatTop.position.y = 2.1;
    g.add(hatBrim, hatTop);
  }

  if (capeColor !== null) {
    const cape = mesh(box(0.45, 0.7, 0.06), capeColor);
    cape.position.set(0, 0.85, -0.17);
    g.add(cape);
  }

  g.scale.setScalar(scale);
  return g;
}

/** npc_healer from actorowebapp AssetLibrary — fits the pastel scene */
export function buildStandingHuman() {
  return buildHumanoid({
    shirtColor: 0xffffff,
    pantsColor: 0x80cbc4,
    hairColor: 0xf9a825,
    skinColor: 0xffebd5,
    shoeColor: 0x5d4037,
  });
}

/** A kindly wanderer the hero meets first (healer palette). */
export function buildWanderer() {
  return buildHumanoid({
    shirtColor: 0xffffff,
    pantsColor: 0x80cbc4,
    hairColor: 0xf9a825,
    skinColor: 0xffebd5,
    shoeColor: 0x5d4037,
    capeColor: 0xb39ddb,
  });
}

/** A cheerful village child (smaller scale). */
export function buildChild() {
  return buildHumanoid({
    shirtColor: 0xffb300,
    pantsColor: 0x1565c0,
    hairColor: 0x5d4037,
    skinColor: 0xffd7b0,
    scale: 0.72,
  });
}

/** A friendly mage waiting at journey's end. */
export function buildFriend() {
  return buildHumanoid({
    shirtColor: 0x7c4dff,
    pantsColor: 0x4527a0,
    hairColor: 0xede7f6,
    skinColor: 0xffe0c2,
    hatColor: 0x7c4dff,
  });
}
