/**
 * Weather selection menu — HTML overlay (Journey Ch.05 §48).
 */
import { WEATHER_TYPES } from "../world/Weather.js";

export default class WeatherMenu {
  constructor(onChange) {
    this.onChange = onChange;
    this.menu = document.getElementById("weather-menu");
    this.options = document.getElementById("weather-options");
    this.toggle = document.getElementById("weather-menu-toggle");

    this.buildOptions();
    this.bindEvents();
  }

  buildOptions() {
    for (const [id, preset] of Object.entries(WEATHER_TYPES)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weather-menu__option";
      btn.dataset.weather = id;
      btn.textContent = preset.label;
      if (id === "clear") btn.classList.add("weather-menu__option--active");
      this.options.appendChild(btn);
    }
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

  setActive(type) {
    for (const btn of this.options.querySelectorAll("[data-weather]")) {
      btn.classList.toggle(
        "weather-menu__option--active",
        btn.dataset.weather === type,
      );
    }
  }
}
