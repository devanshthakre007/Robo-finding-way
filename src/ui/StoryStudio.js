/**
 * Story Script editor — paste AI-Assets-generator JSON and play.
 */
export default class StoryStudio {
  constructor(experience) {
    this.experience = experience;
    this.panel = document.getElementById("story-studio");
    this.toggle = document.getElementById("story-studio-toggle");
    this.scriptInput = document.getElementById("story-script");
    this.generateBtn = document.getElementById("story-generate");
    this.sampleBtn = document.getElementById("story-sample");
    this.statusEl = document.getElementById("story-status");

    this.bindEvents();
  }

  bindEvents() {
    this.toggle?.addEventListener("click", () => {
      this.panel.classList.toggle("story-studio--open");
    });

    this.generateBtn?.addEventListener("click", () => this.generate());
    this.sampleBtn?.addEventListener("click", () => this.loadSample());

    this.scriptInput?.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        this.generate();
      }
    });
  }

  setStatus(msg, kind = "info") {
    if (this.statusEl) {
      this.statusEl.textContent = msg;
      this.statusEl.dataset.kind = kind;
    }
  }

  async loadSample() {
    try {
      const res = await fetch("/ai-assets/sample-story.json");
      if (!res.ok) throw new Error("Sample not found");
      const text = await res.text();
      this.scriptInput.value = text;
      this.setStatus("Sample loaded — edit and press Generate Story.", "success");
    } catch (err) {
      this.setStatus(err.message, "error");
    }
  }

  async generate() {
    const text = this.scriptInput?.value?.trim();
    if (!text) {
      this.setStatus("Paste a story JSON first.", "error");
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      this.setStatus(`Invalid JSON: ${err.message}`, "error");
      return;
    }

    this.setStatus("Building your story…", "info");
    try {
      await this.experience.playCustomStory(data);
      this.setStatus("Playing your story ✓", "success");
    } catch (err) {
      this.setStatus(`Could not play: ${err.message}`, "error");
    }
  }
}
