/**
 * Delta-time clock — Three.js Journey Ch.01 §05 (Animations).
 */
import { Clock } from "three";

export default class Time {
  constructor() {
    this.clock = new Clock();
    this.delta = 0;
    this.elapsed = 0;
  }

  tick() {
    this.delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed = this.clock.getElapsedTime();
  }
}
