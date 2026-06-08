/**
 * HTML overlay UI — Three.js Journey Ch.05 §48 (Mixing HTML and WebGL).
 */
export default class StoryUI {
  constructor() {
    this.loading = document.getElementById("loading");
    this.loadingBar = document.getElementById("loading-bar");
    this.loadingText = document.getElementById("loading-text");
    this.titleCard = document.getElementById("title-card");
    this.titleText = document.getElementById("title-text");
    this.titleSub = document.getElementById("title-sub");
    this.endCard = document.getElementById("end-card");
    this.endText = document.getElementById("end-text");
    this.replay = document.getElementById("replay");
    this.moveHint = document.getElementById("move-hint");
  }

  setLoadProgress(ratio) {
    const pct = Math.round(ratio * 100);
    if (this.loadingBar) this.loadingBar.style.width = `${pct}%`;
    if (this.loadingText) this.loadingText.textContent = `Loading the journey… ${pct}%`;
  }

  hideLoading() {
    this.loading.classList.add("hidden");
  }

  showLoadError(message) {
    if (this.loadingText) this.loadingText.textContent = message;
  }

  showTitle(text, sub = "A 25-second journey") {
    this.titleText.textContent = text;
    this.titleSub.textContent = sub;
    this.titleCard.classList.add("show");
  }

  hideTitle() {
    this.titleCard.classList.remove("show");
  }

  showEnd(text) {
    this.endText.textContent = text;
    this.endCard.classList.add("show");
  }

  hideEnd() {
    this.endCard.classList.remove("show");
  }

  showReplay() {
    this.replay.classList.add("show");
  }

  hideReplay() {
    this.replay.classList.remove("show");
  }

  showMoveHint() {
    if (this.moveHint) this.moveHint.classList.add("show");
  }

  hideMoveHint() {
    if (this.moveHint) this.moveHint.classList.remove("show");
  }

  showLoadingMsg(msg) {
    if (this.loadingText) this.loadingText.textContent = msg;
    if (this.loading) this.loading.classList.remove("hidden");
  }

  setSceneActive(n) {
    const s1 = document.getElementById("scene1-btn");
    const s2 = document.getElementById("scene2-btn");
    const s3 = document.getElementById("scene3-btn");
    if (s1) s1.classList.toggle("scene-btn--active", n === 1);
    if (s2) s2.classList.toggle("scene-btn--active", n === 2);
    if (s3) s3.classList.toggle("scene-btn--active", n === 3);
    const hint = document.getElementById("hint");
    if (hint && n === 3) {
      hint.textContent = "Drag to orbit · scroll to zoom";
    } else if (hint && n === "custom") {
      hint.textContent = "Custom story · drag to look around after it ends";
    } else if (hint) {
      hint.textContent = "An automated story · drag to look around after it ends";
    }
    this.hideReplay();
    this.hideMoveHint();
  }
}
