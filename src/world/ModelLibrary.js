/**
 * Loads saved models from the backend and spawns them into the scene.
 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { makeActor } from "../utils/makeActor.js";
import { runThreeJsScript } from "../utils/runThreeJsScript.js";
import { modelFileUrl, fetchModelScript } from "../utils/modelApi.js";

const SPAWN_OFFSETS = [
  [3, 2],
  [-3, 4],
  [5, -2],
  [-4, -3],
  [0, 6],
  [6, 0],
];

export default class ModelLibrary {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.gltfLoader = new GLTFLoader();
    this.spawned = [];
    this.spawnIndex = 0;
  }

  async spawnAI(tag, name = tag, targetHeight = 1.5) {
    const gltf = await this.loadGltf(`/ai-assets/models/${tag}.glb`);
    const object3d = gltf.scene.clone();
    const actor = makeActor(object3d, targetHeight);
    const [x, z] = SPAWN_OFFSETS[this.spawnIndex % SPAWN_OFFSETS.length];
    this.spawnIndex += 1;
    actor.position.set(x, 0, z);
    actor.userData.modelId = `ai-${tag}`;
    actor.userData.modelName = name;
    this.scene.add(actor);
    this.spawned.push(actor);
    return actor;
  }

  async spawn(entry, targetHeight = 1.5) {
    let object3d;

    if (entry.type === "blender" && entry.file) {
      const gltf = await this.loadGltf(modelFileUrl(entry.id));
      object3d = gltf.scene.clone();
      object3d.rotation.x = Math.PI / 2;
    } else if (entry.type === "threejs") {
      const { script } = await fetchModelScript(entry.id);
      object3d = runThreeJsScript(script);
    } else {
      throw new Error("Unknown model type or missing data.");
    }

    const actor = makeActor(object3d, targetHeight);
    const [x, z] = SPAWN_OFFSETS[this.spawnIndex % SPAWN_OFFSETS.length];
    this.spawnIndex += 1;

    actor.position.set(x, 0, z);
    actor.userData.modelId = entry.id;
    actor.userData.modelName = entry.name;
    this.scene.add(actor);
    this.spawned.push(actor);

    return actor;
  }

  loadGltf(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
  }

  removeSpawned(modelId) {
    const index = this.spawned.findIndex((a) => a.userData.modelId === modelId);
    if (index === -1) return;

    const [actor] = this.spawned.splice(index, 1);
    this.scene.remove(actor);
    actor.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }
}
