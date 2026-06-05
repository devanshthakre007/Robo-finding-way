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
}
