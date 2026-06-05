/**
 * Post-processing — Three.js Journey Ch.05 §45 (Post Processing / Bloom).
 * Subtle bloom keeps the pastel meadow soft and cinematic without blowing out colors.
 */
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default class PostProcessing {
  constructor(experience) {
    this.experience = experience;
    this.renderer = experience.renderer.instance;
    this.scene = experience.scene;
    this.camera = experience.camera.instance;
    this.sizes = experience.sizes;

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new Vector2(this.sizes.width, this.sizes.height),
      0.28,
      0.35,
      0.92,
    );
    this.composer.addPass(this.bloomPass);

    this.resize();
  }

  resize() {
    const { width, height, pixelRatio } = this.sizes;
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(pixelRatio);
    this.bloomPass.resolution.set(width, height);
  }

  update() {
    this.composer.render();
  }
}
