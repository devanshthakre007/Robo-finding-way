/**
 * Lightweight cinematic timeline.
 *
 * A timeline is a flat list of clips, each with an absolute `start` and
 * `duration`. Every frame the player advances global time and updates the
 * clips that are currently active. Clips can run in parallel (camera move +
 * character walk + speech bubble all at once), which makes authoring a
 * passive, automated story straightforward.
 */

import * as THREE from "three";

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export class Timeline {
  constructor() {
    this.clips = [];
    this.time = 0;
    this.duration = 0;
    this.playing = false;
    this.onComplete = null;
    this._completed = false;
  }

  add(clip) {
    this.clips.push(clip);
    this.duration = Math.max(this.duration, clip.start + clip.duration);
    return clip;
  }

  play() {
    this.playing = true;
    this._completed = false;
  }

  reset() {
    this.time = 0;
    this.playing = false;
    this._completed = false;
    for (const clip of this.clips) clip._state = 0;
  }

  update(dt) {
    if (!this.playing) return;
    this.time += dt;

    for (const clip of this.clips) {
      const local = this.time - clip.start;
      const started = local >= 0;
      const ended = local >= clip.duration;

      if (started && clip._state === 0) {
        clip._state = 1;
        clip.onStart && clip.onStart();
      }
      if (clip._state === 1) {
        const raw = clip.duration > 0 ? Math.min(local / clip.duration, 1) : 1;
        clip.onUpdate && clip.onUpdate(raw, (clip.ease || ((x) => x))(raw));
      }
      if (ended && clip._state === 1) {
        clip._state = 2;
        clip.onEnd && clip.onEnd();
      }
    }

    if (this.time >= this.duration && !this._completed) {
      this._completed = true;
      this.playing = false;
      this.onComplete && this.onComplete();
    }
  }
}

/**
 * Director — authoring helpers bound to the scene's camera/controls/bubbles.
 * Each method appends a clip to the shared timeline.
 */
export class Director {
  constructor({ timeline, camera, controls, bubbles }) {
    this.tl = timeline;
    this.camera = camera;
    this.controls = controls;
    this.bubbles = bubbles;
  }

  /** Walk an object across the floor to `to`, facing the motion direction. */
  walk(obj, to, { start, duration, bob = 0, facingOffset = 0, ease = easeInOutCubic } = {}) {
    const target = new THREE.Vector3(to.x, obj.position.y, to.z);
    let from = new THREE.Vector3();
    this.tl.add({
      start,
      duration,
      ease,
      onStart() {
        from.copy(obj.position);
        const dx = target.x - from.x;
        const dz = target.z - from.z;
        if (dx * dx + dz * dz > 1e-5) {
          obj.rotation.y = Math.atan2(dx, dz) + facingOffset;
        }
      },
      onUpdate(raw, e) {
        obj.position.x = from.x + (target.x - from.x) * e;
        obj.position.z = from.z + (target.z - from.z) * e;
        if (bob > 0) {
          const sway = Math.sin(raw * Math.PI * duration * 3) * bob;
          obj.position.y = from.y + Math.abs(sway);
        }
      },
      onEnd() {
        obj.position.x = target.x;
        obj.position.z = target.z;
        obj.position.y = from.y;
      },
    });
    return this;
  }

  /** Rotate an object to look at a world point (around Y). */
  faceTo(obj, point, { start, duration = 0.6, facingOffset = 0, ease = easeInOutCubic } = {}) {
    let from = 0;
    let to = 0;
    this.tl.add({
      start,
      duration,
      ease,
      onStart() {
        from = obj.rotation.y;
        const dx = point.x - obj.position.x;
        const dz = point.z - obj.position.z;
        to = Math.atan2(dx, dz) + facingOffset;
        // shortest path
        while (to - from > Math.PI) to -= Math.PI * 2;
        while (to - from < -Math.PI) to += Math.PI * 2;
      },
      onUpdate(_raw, e) {
        obj.rotation.y = from + (to - from) * e;
      },
    });
    return this;
  }

  /** A little hop / nod for greetings. */
  hop(obj, { start, duration = 0.5, height = 0.25 } = {}) {
    let baseY = 0;
    this.tl.add({
      start,
      duration,
      onStart() {
        baseY = obj.position.y;
      },
      onUpdate(raw) {
        obj.position.y = baseY + Math.sin(raw * Math.PI) * height;
      },
      onEnd() {
        obj.position.y = baseY;
      },
    });
    return this;
  }

  /** Move the camera (and orbit target) to new pose. pos/target may be functions. */
  cameraTo(pos, target, { start, duration, ease = easeInOutCubic } = {}) {
    const camera = this.camera;
    const controls = this.controls;
    const fromPos = new THREE.Vector3();
    const fromTarget = new THREE.Vector3();
    let toPos = new THREE.Vector3();
    let toTarget = new THREE.Vector3();
    this.tl.add({
      start,
      duration,
      ease,
      onStart() {
        fromPos.copy(camera.position);
        fromTarget.copy(controls.target);
        const p = typeof pos === "function" ? pos() : pos;
        const t = typeof target === "function" ? target() : target;
        toPos.set(p.x, p.y, p.z);
        toTarget.set(t.x, t.y, t.z);
      },
      onUpdate(_raw, e) {
        camera.position.lerpVectors(fromPos, toPos, e);
        controls.target.lerpVectors(fromTarget, toTarget, e);
        camera.lookAt(controls.target);
      },
    });
    return this;
  }

  /** Show a speech bubble over an actor for the clip's duration. */
  say(actor, text, { start, duration, name = "", color = "#7c4dff", headY = 2.2 } = {}) {
    const bubbles = this.bubbles;
    const id = `say_${start}_${Math.random().toString(36).slice(2, 7)}`;
    this.tl.add({
      start,
      duration,
      onStart() {
        bubbles.show(id, { text, name, color, object: actor, headY });
      },
      onEnd() {
        bubbles.hide(id);
      },
    });
    return this;
  }

  /** Run an arbitrary callback once at `start`. */
  cue(fn, { start = 0 } = {}) {
    this.tl.add({ start, duration: 0, onStart: fn });
    return this;
  }
}
