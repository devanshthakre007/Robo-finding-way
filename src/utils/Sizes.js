/**
 * Responsive canvas sizing — Three.js Journey Ch.01 §07 (Fullscreen & Resizing).
 */
export default class Sizes {
  constructor() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.trigger("resize");
    });
  }

  on(event, callback) {
    this[`_${event}`] = callback;
  }

  trigger(event) {
    if (this[`_${event}`]) this[`_${event}`]();
  }
}
