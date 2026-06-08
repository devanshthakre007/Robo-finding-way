/**
 * Model script editor + saved model library (HTML overlay).
 */
import {
  fetchModels,
  fetchBlenderStatus,
  fetchModelScript,
  fetchAIAssets,
  createModel,
  deleteModel,
  saveToAIAssets,
} from "../utils/modelApi.js";
import { runThreeJsScript } from "../utils/runThreeJsScript.js";
import { exportGlb } from "../utils/exportGlb.js";
import { BLENDER_TEMPLATE, THREEJS_TEMPLATE } from "./scriptTemplates.js";
import ModelPreview from "./ModelPreview.js";

export default class ModelStudio {
  constructor(modelLibrary) {
    this.modelLibrary = modelLibrary;
    this.models = [];
    this.scriptType = "blender";
    this.busy = false;
    this.previewModel = null;

    this.panel = document.getElementById("model-studio");
    this.toggle = document.getElementById("model-studio-toggle");
    this.scriptInput = document.getElementById("model-script");
    this.nameInput = document.getElementById("model-name");
    this.categoryInput = document.getElementById("model-category");
    this.runBtn = document.getElementById("model-run");
    this.previewBtn = document.getElementById("model-preview");
    this.aiSaveBtn = document.getElementById("model-ai-save");
    this.statusEl = document.getElementById("model-status");
    this.listEl = document.getElementById("model-list");
    this.blenderStatusEl = document.getElementById("blender-status");
    this.typeButtons = this.panel.querySelectorAll("[data-script-type]");
    this.preview = new ModelPreview();

    this.bindEvents();
    this.setScriptType("blender");
    this.refresh();
    this.checkBlender();
  }

  bindEvents() {
    this.toggle.addEventListener("click", () => {
      this.panel.classList.toggle("model-studio--open");
    });

    for (const btn of this.typeButtons) {
      btn.addEventListener("click", () => {
        this.setScriptType(btn.dataset.scriptType);
      });
    }

    this.runBtn.addEventListener("click", () => this.runScript());
    this.previewBtn?.addEventListener("click", () => this.previewScript());
    this.aiSaveBtn?.addEventListener("click", () => this.saveToAIAssets());

    this.scriptInput.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        this.runScript();
      }
    });
  }

  setScriptType(type) {
    this.scriptType = type;
    for (const btn of this.typeButtons) {
      btn.classList.toggle("model-studio__type--active", btn.dataset.scriptType === type);
    }

    const current = this.scriptInput.value.trim();
    const isDefault =
      !current ||
      current === BLENDER_TEMPLATE.trim() ||
      current === THREEJS_TEMPLATE.trim();

    if (isDefault) {
      this.scriptInput.value = type === "blender" ? BLENDER_TEMPLATE : THREEJS_TEMPLATE;
    }
  }

  async checkBlender() {
    const status = await fetchBlenderStatus();
    if (!this.blenderStatusEl) return;

    if (status.available) {
      this.blenderStatusEl.textContent = "Blender connected";
      this.blenderStatusEl.classList.add("model-studio__blender--ok");
      this.blenderStatusEl.classList.remove("model-studio__blender--off");
    } else {
      this.blenderStatusEl.textContent = "Blender not found — Three.js scripts still work";
      this.blenderStatusEl.classList.add("model-studio__blender--off");
      this.blenderStatusEl.classList.remove("model-studio__blender--ok");
    }
  }

  setStatus(message, kind = "info") {
    this.statusEl.textContent = message;
    this.statusEl.dataset.kind = kind;
  }

  setBusy(busy) {
    this.busy = busy;
    this.runBtn.disabled = busy;
    if (this.aiSaveBtn) this.aiSaveBtn.disabled = busy;
    if (this.previewBtn) this.previewBtn.disabled = busy;
    this.runBtn.textContent = busy ? "Building…" : "Save to library ↵";
  }

  buildThreeJsModel() {
    const script = this.scriptInput.value.trim();
    if (!script) throw new Error("Paste a script first.");
    const model = runThreeJsScript(script);
    this.previewModel = model;
    return model;
  }

  previewScript() {
    if (this.scriptType !== "threejs") {
      this.setStatus("Preview is available for Three.js scripts only.", "error");
      return;
    }
    try {
      const model = this.buildThreeJsModel();
      this.preview.show(model);
      this.setStatus("Preview ready.", "success");
    } catch (err) {
      this.setStatus(err.message, "error");
    }
  }

  async saveToAIAssets() {
    if (this.busy) return;
    if (this.scriptType !== "threejs") {
      this.setStatus("Save to AI assets works with Three.js scripts only.", "error");
      return;
    }

    const name = this.nameInput.value.trim();
    const category = this.categoryInput?.value?.trim() || "custom";
    if (!name) {
      this.setStatus("Give the model a name first.", "error");
      return;
    }

    this.setBusy(true);
    this.setStatus("Exporting and saving to AI-Assets-generator…", "info");

    try {
      const model = this.previewModel ?? this.buildThreeJsModel();
      const glb = await exportGlb(model);
      const data = await saveToAIAssets({ name, category, glb });
      await this.refresh();
      this.setStatus(
        `Saved as "${data.tag}.glb" — usable in story scripts and Scene 2.`,
        "success",
      );
    } catch (err) {
      this.setStatus(err.message || "Failed to save AI asset.", "error");
    } finally {
      this.setBusy(false);
    }
  }

  async runScript() {
    if (this.busy) return;

    const script = this.scriptInput.value.trim();
    const name = this.nameInput.value.trim() || "Untitled model";

    if (!script) {
      this.setStatus("Paste a script first.", "error");
      return;
    }

    this.setBusy(true);
    this.setStatus(
      this.scriptType === "blender"
        ? "Running Blender script… this may take a moment."
        : "Building Three.js model…",
      "info",
    );

    try {
      if (this.scriptType === "threejs") {
        this.buildThreeJsModel();
      }

      const entry = await createModel({
        name,
        type: this.scriptType,
        script,
      });

      await this.refresh();
      this.setStatus(
        `"${entry.name}" saved to models/library/ — use "Add to scene" when ready.`,
        "success",
      );
      this.nameInput.value = "";
    } catch (err) {
      this.setStatus(err.message || "Failed to build model.", "error");
    } finally {
      this.setBusy(false);
    }
  }

  async refresh() {
    try {
      const data = await fetchModels();
      const localModels = data.models || [];
      let aiModels = [];
      try {
        const manifest = await fetchAIAssets();
        aiModels = (Array.isArray(manifest) ? manifest : []).map((a) => ({
          id: `ai-${a.tag}`,
          name: a.tag,
          type: "ai-asset",
          tag: a.tag,
          category: a.category,
          source: a.source,
        }));
      } catch {
        aiModels = [];
      }
      this.models = [...localModels, ...aiModels];
      this.renderList();
    } catch {
      this.setStatus("Could not load saved models.", "error");
    }
  }

  renderList() {
    this.listEl.innerHTML = "";

    if (!this.models.length) {
      this.listEl.innerHTML = `<p class="model-studio__empty">No saved models yet. Write a script and press Enter.</p>`;
      return;
    }

    for (const model of this.models) {
      const card = document.createElement("article");
      card.className = "model-studio__card";
      const meta = model.createdAt
        ? new Date(model.createdAt).toLocaleString()
        : model.category || "AI asset";
      card.innerHTML = `
        <div class="model-studio__card-head">
          <strong>${model.name}</strong>
          <span class="model-studio__badge">${model.type}</span>
        </div>
        <p class="model-studio__card-meta">${meta}</p>
        <div class="model-studio__card-actions">
          <button type="button" class="model-studio__spawn" data-id="${model.id}">Add to scene</button>
          ${model.type !== "ai-asset" ? `<button type="button" class="model-studio__load" data-id="${model.id}">Load script</button>` : ""}
          ${model.type !== "ai-asset" ? `<button type="button" class="model-studio__delete" data-id="${model.id}">Delete</button>` : ""}
        </div>
      `;
      this.listEl.appendChild(card);
    }

    this.listEl.querySelectorAll(".model-studio__spawn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const model = this.models.find((m) => m.id === btn.dataset.id);
        if (!model) return;
        try {
          if (model.type === "ai-asset") {
            await this.modelLibrary.spawnAI(model.tag, model.name);
          } else {
            await this.modelLibrary.spawn(model);
          }
          this.setStatus(`"${model.name}" added to the scene.`, "success");
        } catch (err) {
          this.setStatus(err.message, "error");
        }
      });
    });

    this.listEl.querySelectorAll(".model-studio__load").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const model = this.models.find((m) => m.id === btn.dataset.id);
        if (!model) return;
        try {
          const data = await fetchModelScript(model.id);
          this.setScriptType(model.type);
          this.nameInput.value = model.name;
          this.scriptInput.value = data.script;
          this.setStatus(`Loaded script for "${model.name}".`, "success");
        } catch (err) {
          this.setStatus(err.message, "error");
        }
      });
    });

    this.listEl.querySelectorAll(".model-studio__delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const model = this.models.find((m) => m.id === btn.dataset.id);
        if (!model || !confirm(`Delete "${model.name}"?`)) return;
        try {
          await deleteModel(model.id);
          this.modelLibrary.removeSpawned(model.id);
          await this.refresh();
          this.setStatus(`"${model.name}" deleted.`, "success");
        } catch (err) {
          this.setStatus(err.message, "error");
        }
      });
    });
  }
}
