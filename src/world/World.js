/**
 * Meadow scenery — procedural props (Journey Ch.02 §16 Haunted House project style).
 * Firefly particles — Journey Ch.02 §17 (Particles).
 */
import {
  Vector3,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
} from "three";
import {
  buildTree,
  buildRock,
  buildFlower,
  buildCloud,
  buildSignpost,
  buildPath,
} from "../world.js";
import { LAYOUT } from "../story.js";
import { loadHouse, placeHouse } from "./House.js";

export default class World {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.clouds = [];

    this.setPath();
    this.setTrees();
    this.setProps();
    this.setFlowers();
    this.setClouds();
    this.setFireflies();
    this.setHouse();
  }

  async setHouse() {
    try {
      const gltf = await loadHouse();
      this.house = placeHouse(gltf);
      this.scene.add(this.house);
    } catch (err) {
      console.warn("Could not load house1.glb:", err);
    }
  }

  place(obj, x, z, rotY = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    this.scene.add(obj);
    return obj;
  }

  setPath() {
    const points = [
      LAYOUT.heroStart,
      LAYOUT.wp1,
      LAYOUT.wp2,
      LAYOUT.wp3,
      LAYOUT.friend,
    ].map((p) => new Vector3(p.x, 0, p.z));
    this.scene.add(buildPath(points, { width: 1.2 }));
  }

  setTrees() {
    this.place(buildTree({ leafColor: 0x9ccc65 }), -4.5, 3.5);
    this.place(buildTree({ leafColor: 0x81c784, height: 1.2 }), 4.6, -1.5);
    this.place(buildTree({ conical: true, leafColor: 0x66bb6a }), -4.8, -2.5);
    this.place(buildTree({ leafColor: 0xa5d6a7 }), 4.2, -6.5);
    this.place(buildTree({ conical: true, leafColor: 0x7cb342, height: 1.1 }), -4.4, -8.5);
    this.place(buildTree({ leafColor: 0xc5e1a5 }), -4.2, 9.0);
  }

  setProps() {
    this.place(buildRock({ size: 0.9 }), 2.6, 4.6);
    this.place(buildRock({ size: 1.3, color: 0xb0bec5 }), -3.0, -6.0);
    this.place(buildSignpost(), 1.7, 3.6, 0.4);
  }

  setFlowers() {
    const colors = [0xf48fb1, 0xfff176, 0xb39ddb, 0xff8a65, 0x80deea];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 12;
      const x = Math.cos(angle) * radius;
      const z = -3 + Math.sin(angle) * radius;
      if (Math.abs(x) < 1.4 && z > -9 && z < 7) continue;
      const f = buildFlower({ petalColor: colors[i % colors.length] });
      f.rotation.y = Math.random() * Math.PI;
      this.place(f, x, z);
    }
  }

  setClouds() {
    for (let i = 0; i < 6; i++) {
      const c = buildCloud({ scale: 0.9 + Math.random() * 0.8 });
      c.position.set(
        -14 + Math.random() * 28,
        7 + Math.random() * 3,
        -14 + Math.random() * 12,
      );
      c.userData.speed = 0.25 + Math.random() * 0.35;
      this.scene.add(c);
      this.clouds.push(c);
    }
  }

  setFireflies() {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const speeds = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = 0.4 + Math.random() * 2.8;
      positions[i * 3 + 2] = -11 + Math.random() * 20;
      speeds.push({
        phase: Math.random() * Math.PI * 2,
        drift: 0.15 + Math.random() * 0.25,
      });
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xfff59d,
      size: 0.07,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.fireflies = new Points(geometry, material);
    this.fireflies.userData.speeds = speeds;
    this.scene.add(this.fireflies);
  }

  update(delta) {
    const elapsed = this.experience.time.elapsed;

    for (const c of this.clouds) {
      c.position.x += c.userData.speed * delta;
      if (c.position.x > 16) c.position.x = -16;
    }

    if (this.fireflies) {
      const positions = this.fireflies.geometry.attributes.position;
      const speeds = this.fireflies.userData.speeds;

      for (let i = 0; i < speeds.length; i++) {
        const s = speeds[i];
        positions.array[i * 3 + 1] +=
          Math.sin(elapsed * s.drift + s.phase) * delta * 0.35;
        positions.array[i * 3] +=
          Math.cos(elapsed * s.drift * 0.7 + s.phase) * delta * 0.12;
      }
      positions.needsUpdate = true;

      this.fireflies.material.opacity =
        0.55 + Math.sin(elapsed * 1.2) * 0.15;
    }
  }
}
