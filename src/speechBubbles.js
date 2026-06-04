/**
 * HTML speech bubbles projected above 3D characters.
 * Mirrors the actorowebapp approach of floating bubbles over projected heads.
 */

import * as THREE from "three";

export class SpeechBubbles {
  constructor(layer) {
    this.layer = layer;
    this.items = new Map();
    this._v = new THREE.Vector3();
  }

  /** Show (or update) a bubble anchored to `object` at `headY` world height. */
  show(id, { text, name = "", color = "#7c4dff", object, headY = 2.2 }) {
    let item = this.items.get(id);
    if (!item) {
      const el = document.createElement("div");
      el.className = "bubble";
      const nameEl = document.createElement("span");
      nameEl.className = "bubble__name";
      const textEl = document.createElement("span");
      textEl.className = "bubble__text";
      el.appendChild(nameEl);
      el.appendChild(textEl);
      this.layer.appendChild(el);
      item = { el, nameEl, textEl };
      this.items.set(id, item);
    }
    item.object = object;
    item.headY = headY;
    item.nameEl.textContent = name;
    item.nameEl.style.display = name ? "block" : "none";
    item.nameEl.style.color = color;
    item.textEl.textContent = text;
    item.el.style.borderColor = color;
    // restart pop-in animation
    item.el.classList.remove("bubble--in");
    void item.el.offsetWidth;
    item.el.classList.add("bubble--in");
  }

  hide(id) {
    const item = this.items.get(id);
    if (!item) return;
    item.el.classList.add("bubble--out");
    const el = item.el;
    setTimeout(() => el.remove(), 220);
    this.items.delete(id);
  }

  clear() {
    for (const id of [...this.items.keys()]) this.hide(id);
  }

  update(camera, renderer) {
    if (this.items.size === 0) return;
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    for (const item of this.items.values()) {
      if (!item.object) continue;
      item.object.getWorldPosition(this._v);
      this._v.y += item.headY;
      this._v.project(camera);
      const behind = this._v.z > 1;
      const x = (this._v.x * 0.5 + 0.5) * w;
      const y = (-this._v.y * 0.5 + 0.5) * h;
      item.el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
      item.el.style.opacity = behind ? "0" : "1";
    }
  }
}
