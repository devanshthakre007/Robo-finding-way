/**
 * Model catalog + dropdown — drives the full-page Model View scene.
 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fetchModels, fetchAIAssets, fetchModelScript, modelFileUrl } from "../utils/modelApi.js";
import { runThreeJsScript } from "../utils/runThreeJsScript.js";

const BUILTINS = [
  { id: "builtin-robot", name: "Robot", url: "/robot2.glb", source: "builtin" },
  { id: "builtin-human", name: "Human", url: "/human.glb", source: "builtin" },
];

export default class ModelBrowser {
  constructor(experience) {
    this.experience = experience;
    this.panel = document.getElementById("model-browser");
    this.select = document.getElementById("model-browser-select");
    this.statusEl = document.getElementById("model-browser-status");

    this.models = [];
    this.loader = new GLTFLoader();
    this.loading = false;

    this.select?.addEventListener("change", () => this.onSelect());
    this.refresh();
  }

  setVisible(visible) {
    this.panel?.classList.toggle("model-browser--active", visible);
  }

  setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  }

  async refresh() {
    const entries = [...BUILTINS];

    try {
      const { models } = await fetchModels();
      for (const m of models ?? []) {
        entries.push({
          id: `lib-${m.id}`,
          name: m.name,
          source: "library",
          libraryId: m.id,
          type: m.type,
        });
      }
    } catch {
      // local library unavailable
    }

    try {
      const manifest = await fetchAIAssets();
      for (const a of Array.isArray(manifest) ? manifest : []) {
        entries.push({
          id: `ai-${a.tag}`,
          name: a.tag,
          source: "ai-asset",
          tag: a.tag,
          category: a.category,
        });
      }
    } catch {
      // AI manifest unavailable
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    this.models = entries;
    this.populateSelect();
  }

  populateSelect() {
    if (!this.select) return;

    const prev = this.select.value;
    this.select.innerHTML = "";

    if (!this.models.length) {
      this.select.innerHTML = `<option value="">No models found</option>`;
      this.setStatus("");
      return;
    }

    const groups = {
      builtin: "Built-in",
      library: "Saved library",
      "ai-asset": "AI assets",
    };

    const bySource = {};
    for (const m of this.models) {
      (bySource[m.source] ??= []).push(m);
    }

    for (const [source, label] of Object.entries(groups)) {
      const list = bySource[source];
      if (!list?.length) continue;
      const optgroup = document.createElement("optgroup");
      optgroup.label = label;
      for (const m of list) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        optgroup.appendChild(opt);
      }
      this.select.appendChild(optgroup);
    }

    const stillValid = this.models.some((m) => m.id === prev);
    this.select.value = stillValid ? prev : this.models[0].id;
  }

  async showSelected() {
    const id = this.select?.value;
    if (!id) return;
    await this.loadAndShow(id);
  }

  async onSelect() {
    if (this.experience.currentScene !== 3) return;
    await this.loadAndShow(this.select?.value);
  }

  async loadAndShow(id) {
    if (!id || this.loading) return;

    const entry = this.models.find((m) => m.id === id);
    if (!entry) return;

    this.loading = true;
    this.setStatus("Loading…");
    this.experience.storyUI?.showLoadingMsg(`Loading ${entry.name}…`);

    try {
      const object3d = await this.loadEntry(entry);
      this.experience.modelView?.show(object3d);
      this.setStatus(entry.category || entry.source.replace("-", " "));
      this.experience.storyUI?.hideLoading();
    } catch (err) {
      this.setStatus(err.message || "Failed to load model");
      this.experience.storyUI?.hideLoading();
    } finally {
      this.loading = false;
    }
  }

  async loadEntry(entry) {
    if (entry.source === "builtin") {
      const gltf = await this.loadGltf(entry.url);
      return gltf.scene.clone();
    }

    if (entry.source === "ai-asset") {
      const gltf = await this.loadGltf(`/ai-assets/models/${entry.tag}.glb`);
      return gltf.scene.clone();
    }

    if (entry.source === "library") {
      if (entry.type === "blender") {
        const gltf = await this.loadGltf(modelFileUrl(entry.libraryId));
        const obj = gltf.scene.clone();
        obj.rotation.x = Math.PI / 2;
        return obj;
      }
      if (entry.type === "threejs") {
        const { script } = await fetchModelScript(entry.libraryId);
        return runThreeJsScript(script);
      }
    }

    throw new Error("Unknown model source.");
  }

  loadGltf(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
  }
}
