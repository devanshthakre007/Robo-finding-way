/**
 * Perspective camera — Three.js Journey Ch.01 §06 (Cameras).
 */
import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Camera {
  constructor(experience) {
    this.experience = experience;
    this.sizes = experience.sizes;
    this.scene = experience.scene;
    this.canvas = experience.canvas;

    this.instance = new PerspectiveCamera(
      45,
      this.sizes.width / this.sizes.height,
      0.1,
      120,
    );
    this.instance.position.set(0, 3.6, 12.5);
    this.scene.add(this.instance);

    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enabled = false;
    this.controls.target.set(0, 1, 5);
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
    this.controls.update();
  }

  update() {
    if (this.controls.enabled) this.controls.update();
  }
}
