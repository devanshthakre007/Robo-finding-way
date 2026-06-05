/**
 * Main application — Three.js Journey Ch.03 §26 (Code Structuring for Bigger Projects).
 *
 * Orchestrates scene, camera, renderer, world, actors, and the automated story.
 */
import { Scene } from "three";
import robotUrl from "../robot2.glb?url";

import Sizes from "./utils/Sizes.js";
import Time from "./utils/Time.js";
import Resources from "./utils/Resources.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import PostProcessing from "./PostProcessing.js";
import Environment from "./world/Environment.js";
import World from "./world/World.js";
import Actors from "./world/Actors.js";
import StoryUI from "./ui/StoryUI.js";
import WeatherMenu from "./ui/WeatherMenu.js";
import Weather from "./world/Weather.js";
import ModelLibrary from "./world/ModelLibrary.js";
import ModelStudio from "./ui/ModelStudio.js";
import PlayerController from "./controls/PlayerController.js";
import StoryController from "./story/StoryController.js";

export default class Experience {
  constructor(canvas) {
    this.canvas = canvas;

    // Core (Journey Ch.01 §03 — Scene, Camera, Renderer)
    this.scene = new Scene();
    this.sizes = new Sizes();
    this.time = new Time();

    // UI overlay (Journey Ch.05 §48 — Mixing HTML and WebGL)
    this.storyUI = new StoryUI();

    // Asset pipeline (Journey Ch.03 §21 + Ch.05 §47)
    this.resources = new Resources([
      { name: "robot", type: "gltfModel", path: robotUrl },
    ]);

    this.resources.onProgress = (ratio) => {
      this.storyUI.setLoadProgress(ratio);
    };

    this.resources.onError = () => {
      this.storyUI.showLoadError("Failed to load robot2.glb");
    };

    this.resources.onReady = (items) => {
      this.initWorld(items.robot);
    };

    this.sizes.on("resize", () => this.resize());
  }

  initWorld(robotGltf) {
    // Environment + scenery (Journey Ch.02 §14–16)
    this.environment = new Environment(this);
    this.world = new World(this);

    // Camera + renderer
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);
    this.postProcessing = new PostProcessing(this);

    // Characters + story
    this.actors = new Actors(this, robotGltf);
    this.playerController = new PlayerController(this);
    this.story = new StoryController(this);
    this.story.setupMixer(robotGltf);

    // Weather + menu
    this.weather = new Weather(this);
    this.weatherMenu = new WeatherMenu((type) => this.weather.set(type));

    // Model script studio + library
    this.modelLibrary = new ModelLibrary(this);
    this.modelStudio = new ModelStudio(this.modelLibrary);

    this.storyUI.hideLoading();
    this.tick();
  }

  resize() {
    if (this.camera) this.camera.resize();
    if (this.renderer) this.renderer.resize();
    if (this.postProcessing) this.postProcessing.resize();
  }

  tick() {
    requestAnimationFrame(() => this.tick());

    this.time.tick();

    if (this.world) this.world.update(this.time.delta);
    if (this.weather) this.weather.update(this.time.delta);
    if (this.story) this.story.update(this.time.delta);
    if (this.playerController) this.playerController.update(this.time.delta);
    if (this.camera) this.camera.update();
    if (this.postProcessing) this.postProcessing.update();
    else if (this.renderer) this.renderer.update();
  }
}
