/**
 * WebGL renderer — Three.js Journey Ch.01 §03 + §07 (First Project & Resizing).
 */
import { WebGLRenderer, PCFSoftShadowMap, SRGBColorSpace } from "three";

export default class Renderer {
  constructor(experience) {
    this.experience = experience;
    this.canvas = experience.canvas;
    this.sizes = experience.sizes;
    this.scene = experience.scene;
    this.camera = experience.camera;

    this.instance = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.instance.outputColorSpace = SRGBColorSpace;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = PCFSoftShadowMap;

    this.resize();
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    this.instance.render(this.scene, this.camera.instance);
  }
}
