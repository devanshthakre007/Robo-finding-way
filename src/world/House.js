/**
 * Loads house1.glb and places it behind the Mage, door facing the robot's approach.
 */
import { Group, Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LAYOUT } from "../story.js";

import houseUrl from "../../models/library/house1.glb?url";

const HOUSE_SCALE = 0.22;

export function loadHouse() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(houseUrl, resolve, undefined, reject);
  });
}

export function placeHouse(gltf) {
  const wrapper = new Group();
  const model = gltf.scene.clone();
  wrapper.add(model);

  model.scale.setScalar(HOUSE_SCALE);

  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());

  model.position.x -= center.x;
  model.position.y -= box.min.y;
  model.position.z -= center.z;

  const friend = LAYOUT.friend;
  const approach = LAYOUT.wp3;

  wrapper.position.set(friend.x, 0, friend.z - 2.6);

  const dx = approach.x - wrapper.position.x;
  const dz = approach.z - wrapper.position.z;
  wrapper.rotation.y = Math.atan2(dx, dz);

  wrapper.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return wrapper;
}
