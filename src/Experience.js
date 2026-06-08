/**
 * Main application — Scene 1 (meadow), Scene 2 (city), Custom (JSON story).
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
import CityEnvironment from "./world/CityEnvironment.js";
import World from "./world/World.js";
import Actors from "./world/Actors.js";
import World2 from "./world/World2.js";
import Actors2 from "./world/Actors2.js";
import StoryUI from "./ui/StoryUI.js";
import WeatherMenu from "./ui/WeatherMenu.js";
import Weather from "./world/Weather.js";
import ModelLibrary from "./world/ModelLibrary.js";
import ModelStudio from "./ui/ModelStudio.js";
import StoryStudio from "./ui/StoryStudio.js";
import PlayerController from "./controls/PlayerController.js";
import StoryController from "./story/StoryController.js";
import StoryController2 from "./story2/StoryController2.js";
import JSONStoryController from "./story/JSONStoryController.js";

export default class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentScene = 1;
    this.robotGltf = null;

    this.scene = new Scene();
    this.sizes = new Sizes();
    this.time = new Time();

    this.storyUI = new StoryUI();

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
      this.robotGltf = items.robot;
      this.initScene1();
    };

    this.sizes.on("resize", () => this.resize());

    document.getElementById("scene1-btn")?.addEventListener("click", () => this.switchScene(1));
    document.getElementById("scene2-btn")?.addEventListener("click", () => this.switchScene(2));

    document.getElementById("replay")?.addEventListener("click", () => this.replayCurrent());
  }

  replayCurrent() {
    if (this.story) this.story.start();
    else if (this.story2) this.story2.start();
    else if (this.jsonStory) this.jsonStory.start();
  }

  setupWeather(mode) {
    this.weather = new Weather(this, mode);
    if (!this.weatherMenu) {
      this.weatherMenu = new WeatherMenu((type) => this.weather?.set(type));
    }
    this.weatherMenu.rebuild(mode);
  }

  // ── Scene 1 ──────────────────────────────────────────────────────────────
  initScene1() {
    this.clearScene();
    this.currentScene = 1;

    this.environment = new Environment(this);
    this.customEnvironment = null;
    this.cityEnvironment = null;
    this.world = new World(this);

    this.camera = this.camera || new Camera(this);
    this.renderer = this.renderer || new Renderer(this);
    this.postProcessing = this.postProcessing || new PostProcessing(this);

    this.actors = new Actors(this, this.robotGltf);
    this.playerController = new PlayerController(this);
    this.story = new StoryController(this);
    this.story.setupMixer(this.robotGltf);

    this.setupWeather("meadow");

    this.modelLibrary = this.modelLibrary || new ModelLibrary(this);
    this.modelStudio = this.modelStudio || new ModelStudio(this.modelLibrary);
    this.storyStudio = this.storyStudio || new StoryStudio(this);

    this.storyUI.hideLoading();
    this.storyUI.setSceneActive(1);
    if (!this._ticking) { this._ticking = true; this.tick(); }
  }

  // ── Scene 2 ──────────────────────────────────────────────────────────────
  async initScene2() {
    this.clearScene();
    this.currentScene = 2;

    this.cityEnvironment = new CityEnvironment(this);
    this.customEnvironment = this.cityEnvironment;
    this.environment = null;

    this.camera = this.camera || new Camera(this);
    this.camera.instance.position.set(0, 4, 14);
    this.camera.controls.target.set(0, 1, 8);
    this.camera.controls.update();

    this.renderer = this.renderer || new Renderer(this);
    this.postProcessing = this.postProcessing || new PostProcessing(this);

    this.actors2 = new Actors2(this, this.robotGltf);
    this.playerController = new PlayerController(this);

    this.world2 = new World2(this);
    this.storyUI.showLoadingMsg("Loading city…");
    await this.world2.load();
    await this.actors2.loadNPCs();
    this.storyUI.hideLoading();

    this.story2 = new StoryController2(this);
    this.setupWeather("city");

    this.modelLibrary = this.modelLibrary || new ModelLibrary(this);
    this.modelStudio = this.modelStudio || new ModelStudio(this.modelLibrary);
    this.storyStudio = this.storyStudio || new StoryStudio(this);

    this.storyUI.setSceneActive(2);
    if (!this._ticking) { this._ticking = true; this.tick(); }
  }

  // ── Custom JSON story ────────────────────────────────────────────────────
  async playCustomStory(data) {
    this.clearScene();
    this.currentScene = "custom";

    this.environment = new Environment(this);
    this.customEnvironment = this.environment;
    this.cityEnvironment = null;

    this.camera = this.camera || new Camera(this);
    this.renderer = this.renderer || new Renderer(this);
    this.postProcessing = this.postProcessing || new PostProcessing(this);

    this.actors = new Actors(this, this.robotGltf);
    this.actors.hero.visible = false;
    this.playerController = new PlayerController(this);

    this.setupWeather("meadow");

    this.modelLibrary = this.modelLibrary || new ModelLibrary(this);
    this.modelStudio = this.modelStudio || new ModelStudio(this.modelLibrary);
    this.storyStudio = this.storyStudio || new StoryStudio(this);

    this.storyUI.showLoadingMsg("Loading story assets…");
    this.jsonStory = new JSONStoryController(this);
    await this.jsonStory.load(data);
    this.storyUI.hideLoading();
    this.jsonStory.start();

    this.storyUI.setSceneActive("custom");
    if (!this._ticking) { this._ticking = true; this.tick(); }
  }

  async switchScene(n) {
    if (n === this.currentScene) return;
    if (n === 1) this.initScene1();
    else if (n === 2) await this.initScene2();
  }

  clearScene() {
    while (this.scene.children.length) {
      this.scene.remove(this.scene.children[0]);
    }
    if (this.story) { try { this.story.bubbles?.clear(); } catch {} this.story = null; }
    if (this.story2) { try { this.story2.bubbles?.clear(); } catch {} this.story2 = null; }
    if (this.jsonStory) {
      try { this.jsonStory.bubbles?.clear(); } catch {}
      if (this.jsonStory.stage) this.scene.remove(this.jsonStory.stage);
      this.jsonStory = null;
    }
    if (this.playerController) { this.playerController.disable(); this.playerController = null; }
    this.weather = null;
    this.environment = null;
    this.cityEnvironment = null;
    this.customEnvironment = null;
    this.world = null;
    this.world2 = null;
    this.actors = null;
    this.actors2 = null;
  }

  resize() {
    if (this.camera) this.camera.resize();
    if (this.renderer) this.renderer.resize();
    if (this.postProcessing) this.postProcessing.resize();
  }

  tick() {
    requestAnimationFrame(() => this.tick());
    this.time.tick();
    const d = this.time.delta;

    if (this.world) this.world.update(d);
    if (this.weather) this.weather.update(d);
    if (this.story) this.story.update(d);
    if (this.story2) this.story2.update(d);
    if (this.jsonStory) this.jsonStory.update(d);
    if (this.playerController) this.playerController.update(d);
    if (this.camera) this.camera.update();
    if (this.postProcessing) this.postProcessing.update();
    else if (this.renderer) this.renderer.update();
  }
}
