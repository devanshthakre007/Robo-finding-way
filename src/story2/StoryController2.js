/**
 * Scene 2 story playback — city adventure.
 */
import { SpeechBubbles } from "../speechBubbles.js";
import { Timeline, Director } from "../storyPlayer.js";
import { buildStory2, LAYOUT2 } from "./story2.js";

export default class StoryController2 {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.actors2 = experience.actors2;
    this.ui = experience.storyUI;

    this.bubbles = new SpeechBubbles(document.getElementById("story-layer"));
    this.timeline = new Timeline();
    this.director = new Director({
      timeline: this.timeline,
      camera: this.camera.instance,
      controls: this.camera.controls,
      bubbles: this.bubbles,
    });

    this.initialState = this.actors2.snapshot();

    buildStory2(
      this.director,
      {
        hero:     this.actors2.hero,
        bird:     this.actors2.bird,
        bee:      this.actors2.bee,
        elephant: this.actors2.elephant,
      },
      this.ui,
    );

    this.timeline.onComplete = () => {
      this.camera.controls.target.set(
        LAYOUT2.elephant.x, 1.0, LAYOUT2.elephant.z,
      );
      this.camera.controls.enabled = true;
      this.experience.playerController.enable();
      this.ui.showReplay();
    };

    this.start();
  }

  start() {
    this.bubbles.clear();
    this.ui.hideEnd();
    this.ui.hideReplay();
    this.experience.playerController.disable();
    this.actors2.restore(this.initialState);
    this.camera.controls.enabled = false;
    this.timeline.reset();
    this.timeline.play();
  }

  update(delta) {
    this.timeline.update(delta);
    this.bubbles.update(
      this.camera.instance,
      this.experience.renderer.instance,
    );
  }
}
