/**
 * Plays AI-Assets-generator style story JSON (sample-story.json format).
 */
import { Group } from "three";
import { SpeechBubbles } from "../speechBubbles.js";
import { Timeline, Director } from "../storyPlayer.js";
import { loadAIAssets } from "../assets/AIAssets.js";
import { makeActor } from "../utils/makeActor.js";

function skyForEnv(env = "") {
  const e = String(env).toLowerCase();
  if (/ocean|water|sea/.test(e)) return { sky: "#87ceeb", ground: "#3a7ab5" };
  if (/space|galaxy|cosmic/.test(e)) return { sky: "#0a0a1a", ground: "#2d2d44" };
  if (/forest|meadow|grass|park/.test(e)) return { sky: "#90c96e", ground: "#4f7a4a" };
  if (/city|street|urban/.test(e)) return { sky: "#bcd4e6", ground: "#9098a0" };
  if (/night|dark/.test(e)) return { sky: "#1a1a2e", ground: "#2d2d44" };
  return { sky: "#e8d5f2", ground: "#c5e1c5" };
}

export default class JSONStoryController {
  constructor(experience) {
    this.experience = experience;
    this.camera = experience.camera;
    this.ui = experience.storyUI;
    this.stage = new Group();
    experience.scene.add(this.stage);

    this.bubbles = new SpeechBubbles(document.getElementById("story-layer"));
    this.timeline = new Timeline();
    this.director = new Director({
      timeline: this.timeline,
      camera: this.camera.instance,
      controls: this.camera.controls,
      bubbles: this.bubbles,
    });

    this.actors = {};
    this.gltfs = {};
  }

  async load(raw) {
    this.story = raw.story ?? raw;
    this.scenes = this.story.scenes ?? [];
    this.charMap = {};
    for (const c of this.story.characters ?? []) {
      this.charMap[c.id] = c;
    }

    const tags = new Set(["tree", "rock"]);
    for (const c of this.story.characters ?? []) tags.add(c.tag);
    for (const s of this.scenes) {
      for (const t of s.assets_in_scene ?? []) tags.add(t);
    }

    this.gltfs = await loadAIAssets([...tags]);
    this.buildTimeline();
  }

  spawnAsset(tag, x, z, scale = 1) {
    const gltf = this.gltfs[tag];
    if (!gltf) return null;
    const obj = gltf.scene.clone();
    obj.scale.setScalar(scale);
    obj.position.set(x, 0, z);
    obj.traverse((c) => {
      if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
    });
    this.stage.add(obj);
    return obj;
  }

  getSpeakerActor(speakerId) {
    if (this.actors[speakerId]) return this.actors[speakerId];
    const char = this.charMap[speakerId];
    if (!char) return null;
    const gltf = this.gltfs[char.tag];
    if (!gltf) return null;
    const actor = makeActor(gltf.scene.clone(), 1.2);
    this.actors[speakerId] = actor;
    this.stage.add(actor);
    return actor;
  }

  buildTimeline() {
    const d = this.director;
    let t = 0;

    d.cue(() => {
      this.ui.showTitle(this.story.title ?? "Custom Story", "Your story script");
    }, { start: t });
    t += 2.5;
    d.cue(() => this.ui.hideTitle(), { start: t });

    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const dur = scene.duration_seconds ?? 25;
      const pal = skyForEnv(scene.environment);
      const camDist = 5 + (scene.assets_in_scene?.length ?? 2) * 0.8;

      d.cue(() => {
        while (this.stage.children.length) this.stage.remove(this.stage.children[0]);
        this.actors = {};

        const exp = this.experience;
        if (exp.customEnvironment) {
          exp.customEnvironment.skyColor.set(pal.sky);
          exp.scene.background = exp.customEnvironment.skyColor;
          exp.customEnvironment.groundMaterial.color.set(pal.ground);
          if (exp.scene.fog) exp.scene.fog.color.set(pal.sky);
        }

        const assets = scene.assets_in_scene ?? [];
        assets.forEach((tag, idx) => {
          const angle = (idx / assets.length) * Math.PI * 2;
          const r = 2.5 + (idx % 3) * 0.8;
          this.spawnAsset(tag, Math.cos(angle) * r, Math.sin(angle) * r, 0.8 + (idx % 3) * 0.15);
        });

        for (const c of this.story.characters ?? []) {
          const actor = this.getSpeakerActor(c.id);
          if (actor) actor.position.set(0, 0, 1.5);
        }
      }, { start: t });

      d.cameraTo(
        { x: camDist * 0.4, y: 3, z: camDist },
        { x: 0, y: 1, z: 0 },
        { start: t, duration: 2 },
      );

      if (scene.narration) {
        d.cue(() => {
          this.ui.showTitle(scene.title ?? `Scene ${i + 1}`, scene.narration.slice(0, 80));
        }, { start: t + 0.5 });
        d.cue(() => this.ui.hideTitle(), { start: t + dur - 1 });
      }

      if (scene.dialogue) {
        const { speaker, line } = scene.dialogue;
        const actor = this.getSpeakerActor(speaker);
        const char = this.charMap[speaker];
        if (actor) {
          d.say(actor, line, {
            start: t + 2,
            duration: Math.min(4, dur - 3),
            name: char?.name ?? speaker,
            color: "#7c4dff",
            headY: 2,
          });
        }
      }

      t += dur;
    }

    const endText = this.story.end_card?.text ?? "The End";
    d.cue(() => this.ui.showEnd(endText), { start: t });
    d.cameraTo(
      { x: 8, y: 5, z: 6 },
      { x: 0, y: 1, z: 0 },
      { start: t, duration: 2 },
    );

    this.timeline.onComplete = () => {
      this.camera.controls.enabled = true;
      if (this.experience.actors?.hero || this.experience.actors2?.hero) {
        this.experience.playerController?.enable();
      }
      this.ui.showReplay();
    };

  }

  start() {
    this.bubbles.clear();
    this.ui.hideEnd();
    this.ui.hideReplay();
    this.experience.playerController?.disable();
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
