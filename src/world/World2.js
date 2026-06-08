/**
 * Scene 2 — city environment built from AI-Assets-generator models + scene1 trees.
 */
import { loadAIAssets } from "../assets/AIAssets.js";
import { buildTree } from "../world.js";
import { LAYOUT2 } from "../story2/story2.js";

const ASSET_TAGS = [
  "building", "road", "car", "bench",
  "bus_stop", "streetlight", "tree", "bush",
];

// [x, z, scale, rotY]
const BUILDINGS = [
  // Main destination — story end
  [LAYOUT2.elephant.x - 0.5, LAYOUT2.elephant.z - 3.5, 1.9, 0],
  // Left block — mid-rise skyline
  [-7.5, 8, 1.5, Math.PI * 0.08],
  [-9, 4, 1.35, -Math.PI * 0.05],
  [-8, 0, 1.6, Math.PI * 0.12],
  [-7, -4, 1.4, -Math.PI * 0.06],
  [-8.5, -8, 1.55, Math.PI * 0.1],
  [-9.5, -12, 1.3, 0],
  // Right block
  [7.5, 9, 1.45, -Math.PI * 0.1],
  [8.5, 5, 1.6, Math.PI * 0.06],
  [7, 1, 1.35, -Math.PI * 0.08],
  [9, -3, 1.5, Math.PI * 0.05],
  [8, -7, 1.4, -Math.PI * 0.12],
  [7.5, -11, 1.55, 0],
  // Background row — depth
  [-12, 6, 1.2, Math.PI * 0.15],
  [-12, -2, 1.25, 0],
  [-12, -9, 1.15, -Math.PI * 0.1],
  [12, 7, 1.2, -Math.PI * 0.12],
  [12, 0, 1.3, Math.PI * 0.08],
  [12, -8, 1.2, 0],
  [0, -14, 1.7, Math.PI],
  [-5, -15, 1.25, Math.PI * 0.05],
  [5, -15, 1.3, -Math.PI * 0.05],
];

const AI_TREES = [
  [5.5, 10], [-5.5, 9], [5.8, 6], [-5.8, 5],
  [5.2, 2], [-5.2, 0.5], [5.6, -2], [-5.6, -3.5],
  [5.4, -6], [-5.4, -7.5], [5.8, -10], [-5.8, -11],
  [8, 11], [-8, 10], [8, 2], [-8, -1],
  [8, -6], [-8, -8], [10, 4], [-10, 3],
  [10, -4], [-10, -6],
];

const MEADOW_TREES = [
  { x: 4.2, z: 8.5, leafColor: 0x9ccc65, conical: false, height: 1.0 },
  { x: -4.2, z: 7.5, leafColor: 0x81c784, conical: true, height: 1.1 },
  { x: 4.5, z: 4, leafColor: 0xa5d6a7, conical: false, height: 0.95 },
  { x: -4.5, z: 2.5, leafColor: 0x66bb6a, conical: true, height: 1.05 },
  { x: 4.3, z: -0.5, leafColor: 0x7cb342, conical: false, height: 1.0 },
  { x: -4.3, z: -2, leafColor: 0xc5e1a5, conical: false, height: 0.9 },
  { x: 4.6, z: -5, leafColor: 0x81c784, conical: true, height: 1.15 },
  { x: -4.6, z: -6.5, leafColor: 0x9ccc65, conical: false, height: 1.0 },
  { x: 4.4, z: -9, leafColor: 0xa5d6a7, conical: true, height: 1.0 },
  { x: -4.4, z: -10.5, leafColor: 0x66bb6a, conical: false, height: 1.05 },
  { x: 6.5, z: 12, leafColor: 0x9ccc65, conical: true, height: 1.2 },
  { x: -6.5, z: 11, leafColor: 0x81c784, conical: false, height: 1.1 },
  { x: 6.8, z: -12, leafColor: 0x7cb342, conical: false, height: 1.0 },
  { x: -6.8, z: -13, leafColor: 0xc5e1a5, conical: true, height: 1.05 },
  { x: 9.5, z: 8, leafColor: 0xa5d6a7, conical: false, height: 0.95 },
  { x: -9.5, z: 6, leafColor: 0x66bb6a, conical: true, height: 1.1 },
  { x: 9.2, z: -2, leafColor: 0x81c784, conical: false, height: 1.0 },
  { x: -9.2, z: -4, leafColor: 0x9ccc65, conical: true, height: 1.0 },
  { x: 11, z: 0, leafColor: 0x7cb342, conical: false, height: 1.15 },
  { x: -11, z: -8, leafColor: 0xc5e1a5, conical: false, height: 0.9 },
];

export default class World2 {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.ready = false;
  }

  async load() {
    const gltfs = await loadAIAssets(ASSET_TAGS);
    this.gltfs = gltfs;
    this.build();
    this.ready = true;
  }

  clone(tag, scale = 1) {
    const gltf = this.gltfs[tag];
    if (!gltf) return null;
    const obj = gltf.scene.clone();
    obj.scale.setScalar(scale);
    obj.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    return obj;
  }

  place(obj, x, z, rotY = 0) {
    if (!obj) return null;
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    this.scene.add(obj);
    return obj;
  }

  build() {
    const road = this.clone("road", 2.2);
    if (road) {
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.01, 0);
      road.scale.set(1.2, 10, 1);
      this.scene.add(road);
    }

    for (const [x, z, scale, rotY] of BUILDINGS) {
      this.place(this.clone("building", scale), x, z, rotY);
    }

    this.place(this.clone("car", 0.9), 3.5, 7, Math.PI * 0.5);
    this.place(this.clone("car", 0.9), -3.5, 1, -Math.PI * 0.5);
    this.place(this.clone("car", 0.9), 3.5, -3.5, Math.PI * 0.5);
    this.place(this.clone("car", 0.85), -3.2, 5.5, Math.PI);
    this.place(this.clone("car", 0.85), 3.2, -7, -Math.PI * 0.5);

    this.place(this.clone("bench", 1.0), LAYOUT2.bird.x + 0.2, LAYOUT2.bird.z - 0.5, Math.PI * 0.5);
    this.place(this.clone("bus_stop", 1.1), LAYOUT2.bee.x - 0.4, LAYOUT2.bee.z + 0.4, Math.PI);

    const lightPositions = [
      [2.8, 9.5], [-2.8, 7.5], [2.8, 5], [-2.8, 3],
      [2.8, 0.5], [-2.8, -1], [2.8, -3.5], [-2.8, -5.5],
      [2.8, -7.5], [-2.8, -9.5], [2.8, -11.5], [-2.8, -13],
    ];
    for (const [x, z] of lightPositions) {
      this.place(this.clone("streetlight", 0.9), x, z);
    }

    for (const [x, z] of AI_TREES) {
      const scale = 0.95 + Math.random() * 0.3;
      const rot = Math.random() * Math.PI * 2;
      this.place(this.clone("tree", scale), x, z, rot);
    }

    for (const cfg of MEADOW_TREES) {
      const tree = buildTree(cfg);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.place(tree, cfg.x, cfg.z);
    }

    const bushPos = [
      [4.5, 6], [-4.5, 4.5], [4.5, 0], [-4.5, -1.5],
      [4.5, -4.5], [-4.5, -6], [4.5, -9], [-4.5, -10.5],
      [7, 8], [-7, 6], [7, -5], [-7, -7],
    ];
    for (const [x, z] of bushPos) {
      this.place(this.clone("bush", 0.8 + Math.random() * 0.2), x, z, Math.random() * Math.PI);
    }
  }
}
