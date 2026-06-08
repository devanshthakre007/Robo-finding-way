/**
 * Weather selection menu — works in meadow and city scenes.
 */
import { WEATHER_TYPES, WEATHER_TYPES_CITY } from "../world/Weather.js";

export default class WeatherMenu {
  constructor(onChange) {
    this.onChange = onChange;
    this.mode = "meadow";
    this.menu = document.getElementById("weather-menu");
    this.options = document.getElementById("weather-options");
    this.toggle = document.getElementById("weather-menu-toggle");
    this.bindEvents();
    this.rebuild("meadow");
  }

  bindEvents() {
    this.toggle.addEventListener("click", () => {
      this.menu.classList.toggle("weather-menu--open");
    });

    this.options.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-weather]");
      if (!btn) return;
      const type = btn.dataset.weather;
      this.setActive(type);
      this.onChange(type);
    });
  }

  rebuild(mode) {
    this.mode = mode;
    this.options.innerHTML = "";
    const presets = mode === "city" ? WEATHER_TYPES_CITY : WEATHER_TYPES;
    for (const [id, preset] of Object.entries(presets)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weather-menu__option";
      btn.dataset.weather = id;
      btn.textContent = preset.label;
      if (id === "clear") btn.classList.add("weather-menu__option--active");
      this.options.appendChild(btn);
    }
  }

  setActive(type) {
    for (const btn of this.options.querySelectorAll("[data-weather]")) {
      btn.classList.toggle(
        "weather-menu__option--active",
        btn.dataset.weather === type,
      );
    }
  }
}
