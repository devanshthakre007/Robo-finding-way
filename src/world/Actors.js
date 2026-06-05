/**
 * Characters — imported GLTF hero + procedural NPCs (Journey Ch.03 §21 Imported Models).
 */
import { buildWanderer, buildChild, buildFriend } from "../buildHumanoid.js";
import { makeActor } from "../utils/makeActor.js";
import { LAYOUT } from "../story.js";

const HERO_HEIGHT = 1.5;
const ADULT_HEIGHT = 1.7;
const CHILD_HEIGHT = 1.15;

function placeActor(scene, actor, x, z, rotY = 0) {
  actor.position.set(x, 0, z);
  actor.rotation.y = rotY;
  scene.add(actor);
  return actor;
}

export default class Actors {
  constructor(experience, robotGltf) {
    this.experience = experience;
    this.scene = experience.scene;

    const model = robotGltf.scene.clone();
    model.rotation.x = Math.PI / 2;
    this.hero = makeActor(model, HERO_HEIGHT);
    placeActor(this.scene, this.hero, LAYOUT.heroStart.x, LAYOUT.heroStart.z);

    this.wanderer = makeActor(buildWanderer(), ADULT_HEIGHT);
    placeActor(this.scene, this.wanderer, LAYOUT.wanderer.x, LAYOUT.wanderer.z, Math.PI);

    this.child = makeActor(buildChild(), CHILD_HEIGHT);
    placeActor(this.scene, this.child, LAYOUT.child.x, LAYOUT.child.z, Math.PI * 0.5);

    this.friend = makeActor(buildFriend(), ADULT_HEIGHT);
    placeActor(this.scene, this.friend, LAYOUT.friend.x, LAYOUT.friend.z, Math.PI);
  }

  getAll() {
    return [this.hero, this.wanderer, this.child, this.friend];
  }

  snapshot() {
    return this.getAll().map((o) => ({
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
