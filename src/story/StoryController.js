/**
 * Story playback — ties timeline, director, speech bubbles, and actors together.
 */
import { AnimationMixer } from "three";
import { SpeechBubbles } from "../speechBubbles.js";
import { Timeline, Director } from "../storyPlayer.js";
import { buildStory, LAYOUT } from "../story.js";

export default class StoryController {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.actors = experience.actors;
    this.ui = experience.storyUI;

    this.bubbles = new SpeechBubbles(document.getElementById("story-layer"));
    this.timeline = new Timeline();
    this.director = new Director({
      timeline: this.timeline,
      camera: this.camera.instance,
      controls: this.camera.controls,
      bubbles: this.bubbles,
    });

    this.initialState = this.actors.snapshot();

    buildStory(this.director, {
      hero: this.actors.hero,
      wanderer: this.actors.wanderer,
      child: this.actors.child,
      friend: this.actors.friend,
    }, this.ui);

    this.timeline.onComplete = () => {
      this.camera.controls.target.set(LAYOUT.wp3.x, 1.0, LAYOUT.wp3.z);
      this.camera.controls.enabled = true;
      this.experience.playerController.enable();
      this.ui.showReplay();
    };

    this.ui.replay.addEventListener("click", () => this.start());
    this.start();
  }

  setupMixer(robotGltf) {
    if (robotGltf.animations.length === 0) return;
    this.mixer = new AnimationMixer(this.actors.hero.children[0]);
    robotGltf.animations.forEach((clip) => this.mixer.clipAction(clip).play());
  }

  start() {
    this.bubbles.clear();
    this.ui.hideEnd();
    this.ui.hideReplay();
    this.experience.playerController.disable();
    this.actors.restore(this.initialState);
    this.camera.controls.enabled = false;
    this.timeline.reset();
    this.timeline.play();
  }

  update(delta) {
    this.timeline.update(delta);
    if (this.mixer) this.mixer.update(delta);
    this.bubbles.update(this.camera.instance, this.experience.renderer.instance);
  }
}
