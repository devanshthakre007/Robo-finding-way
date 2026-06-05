/**
 * Arrow-key movement for the hero after the story ends.
 */
const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export default class PlayerController {
  constructor(experience) {
    this.experience = experience;
    this.actor = experience.actors.hero;
    this.enabled = false;
    this.speed = 4;
    this.keys = { up: false, down: false, left: false, right: false };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  enable() {
    this.enabled = true;
    this.experience.storyUI.showMoveHint();
  }

  disable() {
    this.enabled = false;
    this.keys = { up: false, down: false, left: false, right: false };
    this.experience.storyUI.hideMoveHint();
  }

  onKeyDown(event) {
    if (!this.enabled) return;
    const key = KEY_MAP[event.key];
    if (!key) return;
    event.preventDefault();
    this.keys[key] = true;
  }

  onKeyUp(event) {
    const key = KEY_MAP[event.key];
    if (!key) return;
    this.keys[key] = false;
  }

  update(delta) {
    if (!this.enabled) return;

    let dx = 0;
    let dz = 0;
    if (this.keys.up) dz -= 1;
    if (this.keys.down) dz += 1;
    if (this.keys.left) dx -= 1;
    if (this.keys.right) dx += 1;

    if (dx === 0 && dz === 0) return;

    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;

    this.actor.position.x += dx * this.speed * delta;
    this.actor.position.z += dz * this.speed * delta;
    this.actor.rotation.y = Math.atan2(dx, dz);

    this.actor.position.x = Math.max(-14, Math.min(14, this.actor.position.x));
    this.actor.position.z = Math.max(-14, Math.min(14, this.actor.position.z));
  }
}
