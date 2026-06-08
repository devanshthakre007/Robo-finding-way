/**
 * Scene 2 actors — robot hero + AI-Assets city characters.
 */
import { Group, Box3, Vector3 } from "three";
import { loadAIAssets } from "../assets/AIAssets.js";
import { makeActor } from "../utils/makeActor.js";
import { LAYOUT2 } from "../story2/story2.js";

const HERO_HEIGHT     = 1.5;
const BIRD_HEIGHT     = 0.9;
const BEE_HEIGHT      = 0.7;
const ELEPHANT_HEIGHT = 2.2;

function place(scene, actor, x, z, rotY = 0) {
  actor.position.set(x, 0, z);
  actor.rotation.y = rotY;
  scene.add(actor);
  return actor;
}

export default class Actors2 {
  constructor(experience, robotGltf) {
    this.experience = experience;
    this.scene = experience.scene;
    this.ready = false;

    // Hero uses the same robot GLB as scene 1
    const robotModel = robotGltf.scene.clone();
    robotModel.rotation.x = Math.PI / 2;
    this.hero = makeActor(robotModel, HERO_HEIGHT);
    place(this.scene, this.hero, LAYOUT2.heroStart.x, LAYOUT2.heroStart.z);
  }

  async loadNPCs() {
    const gltfs = await loadAIAssets(["bird", "bee", "elephant"]);

    const birdModel = gltfs.bird.scene.clone();
    this.bird = makeActor(birdModel, BIRD_HEIGHT);
    place(this.scene, this.bird, LAYOUT2.bird.x, LAYOUT2.bird.z, -Math.PI * 0.5);

    const beeModel = gltfs.bee.scene.clone();
    this.bee = makeActor(beeModel, BEE_HEIGHT);
    this.bee.position.set(LAYOUT2.bee.x, 0.5, LAYOUT2.bee.z); // hover above ground
    this.bee.rotation.y = Math.PI * 0.5;
    this.scene.add(this.bee);

    const elModel = gltfs.elephant.scene.clone();
    this.elephant = makeActor(elModel, ELEPHANT_HEIGHT);
    place(this.scene, this.elephant, LAYOUT2.elephant.x, LAYOUT2.elephant.z, Math.PI);

    this.ready = true;
    return this;
  }

  snapshot() {
    const actors = [this.hero];
    if (this.bird) actors.push(this.bird);
    if (this.bee) actors.push(this.bee);
    if (this.elephant) actors.push(this.elephant);
    return actors.map((o) => ({
      obj: o,
      pos: o.position.clone(),
      quat: o.quaternion.clone(),
    }));
  }

  restore(snapshots) {
    for (const s of snapshots) {
      s.obj.position.copy(s.pos);
      s.obj.quaternion.copy(s.quat);
    }
  }
}
