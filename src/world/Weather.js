/**
 * Weather presets — works in meadow (scene 1) and city (scene 2).
 */
import {
  Color,
  Fog,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
} from "three";

const MEADOW = {
  clear: {
    label: "Clear",
    sky: "#E8D5F2", ground: "#C5E1C5", fog: "#E8D5F2",
    fogNear: 12, fogFar: 34, ambient: 0.62, sun: 0.95,
    sunColor: "#fff6ec", hemi: 0.45, particles: null, fireflyOpacity: 0.75,
  },
  cloudy: {
    label: "Cloudy",
    sky: "#B8C4D4", ground: "#A8B8A0", fog: "#C5CED8",
    fogNear: 8, fogFar: 28, ambient: 0.7, sun: 0.55,
    sunColor: "#e8edf5", hemi: 0.35, particles: null, fireflyOpacity: 0.4,
  },
  foggy: {
    label: "Foggy",
    sky: "#C8C8CC", ground: "#9EA89A", fog: "#D8D8DC",
    fogNear: 4, fogFar: 18, ambient: 0.75, sun: 0.35,
    sunColor: "#f0f0f2", hemi: 0.25, particles: null, fireflyOpacity: 0.2,
  },
  rainy: {
    label: "Rainy",
    sky: "#6B7B8C", ground: "#7A8A7A", fog: "#7A8A94",
    fogNear: 6, fogFar: 22, ambient: 0.55, sun: 0.3,
    sunColor: "#c8d4dc", hemi: 0.2, particles: "rain",
    rainCount: 900, fireflyOpacity: 0.1,
  },
  snowy: {
    label: "Snowy",
    sky: "#D8E4F0", ground: "#E8EEF4", fog: "#E0EAF2",
    fogNear: 10, fogFar: 30, ambient: 0.85, sun: 0.6,
    sunColor: "#f5f8fc", hemi: 0.5, particles: "snow",
    snowCount: 450, fireflyOpacity: 0,
  },
  storm: {
    label: "Storm",
    sky: "#3D4550", ground: "#5A6A5A", fog: "#4A5560",
    fogNear: 3, fogFar: 16, ambient: 0.4, sun: 0.15,
    sunColor: "#8898a8", hemi: 0.15, particles: "rain",
    rainCount: 1400, fireflyOpacity: 0,
  },
};

const CITY = {
  clear: {
    label: "Clear",
    sky: "#7DB8E8", ground: "#9E9E9E", fog: "#7DB8E8",
    fogNear: 20, fogFar: 55, ambient: 0.75, sun: 1.4,
    sunColor: "#fff6e0", hemi: 0.55, particles: null,
  },
  cloudy: {
    label: "Cloudy",
    sky: "#9AA8B8", ground: "#8A8A8A", fog: "#A8B0B8",
    fogNear: 15, fogFar: 45, ambient: 0.65, sun: 0.7,
    sunColor: "#e0e4e8", hemi: 0.4, particles: null,
  },
  foggy: {
    label: "Foggy",
    sky: "#B0B4B8", ground: "#7A7A7A", fog: "#C0C4C8",
    fogNear: 8, fogFar: 30, ambient: 0.8, sun: 0.4,
    sunColor: "#f0f0f0", hemi: 0.3, particles: null,
  },
  rainy: {
    label: "Rainy",
    sky: "#5A6A7A", ground: "#6A6A6A", fog: "#6A7A88",
    fogNear: 10, fogFar: 35, ambient: 0.55, sun: 0.35,
    sunColor: "#c0c8d0", hemi: 0.2, particles: "rain",
    rainCount: 1200,
  },
  snowy: {
    label: "Snowy",
    sky: "#D0DCE8", ground: "#C8C8C8", fog: "#D8E4F0",
    fogNear: 12, fogFar: 40, ambient: 0.85, sun: 0.65,
    sunColor: "#f5f8fc", hemi: 0.5, particles: "snow",
    snowCount: 500,
  },
  storm: {
    label: "Storm",
    sky: "#2A3040", ground: "#4A4A4A", fog: "#3A4050",
    fogNear: 6, fogFar: 25, ambient: 0.35, sun: 0.2,
    sunColor: "#8090a0", hemi: 0.15, particles: "rain",
    rainCount: 1600,
  },
};

export const WEATHER_TYPES = MEADOW;
export const WEATHER_TYPES_CITY = CITY;

export default class Weather {
  constructor(experience, mode = "meadow") {
    this.experience = experience;
    this.scene = experience.scene;
    this.mode = mode;
    this.current = "clear";
    this.particles = null;
    this.particleKind = null;
    this.particleData = [];

    this.set("clear");
  }

  getPresets() {
    return this.mode === "city" ? CITY : MEADOW;
  }

  getTarget() {
    const exp = this.experience;
    if (exp.environment) return exp.environment;
    if (exp.cityEnvironment) return exp.cityEnvironment;
    if (exp.customEnvironment) return exp.customEnvironment;
    return null;
  }

  setMode(mode) {
    this.mode = mode;
    this.set(this.current);
  }

  set(type) {
    const preset = this.getPresets()[type];
    if (!preset) return;

    this.current = type;
    const env = this.getTarget();
    if (!env) return;

    env.skyColor.set(preset.sky);
    this.scene.background = env.skyColor;

    if (!this.scene.fog) {
      this.scene.fog = new Fog(preset.fog, preset.fogNear, preset.fogFar);
    }
    this.scene.fog.color.set(preset.fog);
    this.scene.fog.near = preset.fogNear;
    this.scene.fog.far = preset.fogFar;

    if (env.groundMaterial) {
      env.groundMaterial.color.set(preset.ground);
    }
    env.ambientLight.intensity = preset.ambient;
    env.sun.intensity = preset.sun;
    env.sun.color.set(preset.sunColor);
    env.hemiLight.intensity = preset.hemi;
    env.hemiLight.color.set(preset.sky);
    env.hemiLight.groundColor.set(preset.ground);

    const fireflies = this.experience.world?.fireflies;
    if (fireflies && preset.fireflyOpacity !== undefined) {
      fireflies.material.opacity = preset.fireflyOpacity;
    }

    this.setParticles(preset);
  }

  setParticles(preset) {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
      this.particleKind = null;
      this.particleData = [];
    }
    if (!preset.particles) return;

    const spread = this.mode === "city" ? 40 : 28;
    if (preset.particles === "rain") {
      this.createRain(preset.rainCount ?? 900, spread);
    } else if (preset.particles === "snow") {
      this.createSnow(preset.snowCount ?? 450, spread);
    }
  }

  createRain(count, spread) {
    const positions = new Float32Array(count * 3);
    const data = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      data.push({ speed: 10 + Math.random() * 8 });
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0xb8d4e8, size: 0.06, transparent: true,
      opacity: 0.65, depthWrite: false,
    });
    this.particles = new Points(geometry, material);
    this.particleKind = "rain";
    this.particleData = data;
    this.scene.add(this.particles);
  }

  createSnow(count, spread) {
    const positions = new Float32Array(count * 3);
    const data = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      data.push({
        speed: 1.2 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new PointsMaterial({
      color: 0xffffff, size: 0.14, transparent: true,
      opacity: 0.9, depthWrite: false, blending: AdditiveBlending,
    });
    this.particles = new Points(geometry, material);
    this.particleKind = "snow";
    this.particleData = data;
    this.scene.add(this.particles);
  }

  resetParticle(i, positions, spread) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = 10 + Math.random() * 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  update(delta) {
    if (!this.particles) return;
    const spread = this.mode === "city" ? 40 : 28;
    const positions = this.particles.geometry.attributes.position;
    const elapsed = this.experience.time.elapsed;

    if (this.particleKind === "rain") {
      for (let i = 0; i < this.particleData.length; i++) {
        positions.array[i * 3 + 1] -= this.particleData[i].speed * delta;
        if (positions.array[i * 3 + 1] < 0) {
          this.resetParticle(i, positions.array, spread);
        }
      }
    } else if (this.particleKind === "snow") {
      for (let i = 0; i < this.particleData.length; i++) {
        const d = this.particleData[i];
        positions.array[i * 3 + 1] -= d.speed * delta;
        positions.array[i * 3] +=
          Math.sin(elapsed * 0.8 + d.phase) * d.drift * delta;
        if (positions.array[i * 3 + 1] < 0) {
          this.resetParticle(i, positions.array, spread);
        }
      }
    }
    positions.needsUpdate = true;
  }
}
