/**
 * Normalize and wrap a loaded/built model for the scene.
 */
import { Group, Box3, Vector3 } from "three";

export function makeActor(model, targetHeight = 1.5) {
  const wrapper = new Group();
  wrapper.add(model);

  model.updateMatrixWorld(true);
  let box = new Box3().setFromObject(model);
  const scale = targetHeight / box.getSize(new Vector3()).y;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);

  box = new Box3().setFromObject(model);
  const center = box.getCenter(new Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;

  wrapper.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return wrapper;
}
