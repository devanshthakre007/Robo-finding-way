/**
 * Weather presets — atmosphere, fog, lighting, and particle effects.
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

export const WEATHER_TYPES = {
  clear: {
    label: "Clear",
    sky: "#E8D5F2",
    ground: "#C5E1C5",
    fog: "#E8D5F2",
    fogNear: 12,
    fogFar: 34,
    ambient: 0.62,
    sun: 0.95,
    sunColor: "#fff6ec",
    hemi: 0.45,
    particles: null,
    fireflyOpacity: 0.75,
  },
  cloudy: {
    label: "Cloudy",
    sky: "#B8C4D4",
    ground: "#A8B8A0",
    fog: "#C5CED8",
    fogNear: 8,
    fogFar: 28,
    ambient: 0.7,
    sun: 0.55,
    sunColor: "#e8edf5",
    hemi: 0.35,
    particles: null,
    fireflyOpacity: 0.4,
  },
  foggy: {
    label: "Foggy",
    sky: "#C8C8CC",
    ground: "#9EA89A",
    fog: "#D8D8DC",
    fogNear: 4,
    fogFar: 18,
    ambient: 0.75,
    sun: 0.35,
    sunColor: "#f0f0f2",
    hemi: 0.25,
    particles: null,
    fireflyOpacity: 0.2,
  },
  rainy: {
    label: "Rainy",
    sky: "#6B7B8C",
    ground: "#7A8A7A",
    fog: "#7A8A94",
    fogNear: 6,
    fogFar: 22,
    ambient: 0.55,
    sun: 0.3,
    sunColor: "#c8d4dc",
    hemi: 0.2,
    particles: "rain",
    rainCount: 900,
    fireflyOpacity: 0.1,
  },
  snowy: {
    label: "Snowy",
    sky: "#D8E4F0",
    ground: "#E8EEF4",
    fog: "#E0EAF2",
    fogNear: 10,
    fogFar: 30,
    ambient: 0.85,
    sun: 0.6,
    sunColor: "#f5f8fc",
    hemi: 0.5,
    particles: "snow",
    snowCount: 450,
    fireflyOpacity: 0,
  },
  storm: {
    label: "Storm",
    sky: "#3D4550",
    ground: "#5A6A5A",
    fog: "#4A5560",
    fogNear: 3,
    fogFar: 16,
    ambient: 0.4,
    sun: 0.15,
    sunColor: "#8898a8",
    hemi: 0.15,
    particles: "rain",
    rainCount: 1400,
    fireflyOpacity: 0,
  },
};

export default class Weather {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.environment = experience.environment;
    this.world = experience.world;

    this.current = "clear";
    this.particles = null;
    this.particleKind = null;
    this.particleData = [];

    this.set("clear");
  }

  set(type) {
    const preset = WEATHER_TYPES[type];
    if (!preset) return;

    this.current = type;
    const env = this.environment;

    env.skyColor.set(preset.sky);
    this.scene.background = env.skyColor;

    if (!this.scene.fog) {
      this.scene.fog = new Fog(preset.fog, preset.fogNear, preset.fogFar);
    }
    this.scene.fog.color.set(preset.fog);
    this.scene.fog.near = preset.fogNear;
    this.scene.fog.far = preset.fogFar;

    env.groundMaterial.color.set(preset.ground);
    env.ambientLight.intensity = preset.ambient;
    env.sun.intensity = preset.sun;
    env.sun.color.set(preset.sunColor);
    env.hemiLight.intensity = preset.hemi;
    env.hemiLight.color.set(preset.sky);
    env.hemiLight.groundColor.set(preset.ground);

    if (this.world?.fireflies) {
      this.world.fireflies.material.opacity = preset.fireflyOpacity;
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

    if (preset.particles === "rain") {
      this.createRain(preset.rainCount ?? 900);
    } else if (preset.particles === "snow") {
      this.createSnow(preset.snowCount ?? 450);
    }
  }

  createRain(count) {
    const positions = new Float32Array(count * 3);
    const data = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 28;
      const y = Math.random() * 14;
      const z = -14 + Math.random() * 26;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      data.push({ speed: 10 + Math.random() * 8 });
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xb8d4e8,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    this.particles = new Points(geometry, material);
    this.particleKind = "rain";
    this.particleData = data;
    this.scene.add(this.particles);
  }

  createSnow(count) {
    const positions = new Float32Array(count * 3);
    const data = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 28;
      const y = Math.random() * 12;
      const z = -14 + Math.random() * 26;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      data.push({
        speed: 1.2 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xffffff,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.particles = new Points(geometry, material);
    this.particleKind = "snow";
    this.particleData = data;
    this.scene.add(this.particles);
  }

  resetParticle(i, positions) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = 10 + Math.random() * 4;
    positions[i * 3 + 2] = -14 + Math.random() * 26;
  }

  update(delta) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position;
    const elapsed = this.experience.time.elapsed;

    if (this.particleKind === "rain") {
      for (let i = 0; i < this.particleData.length; i++) {
        positions.array[i * 3 + 1] -= this.particleData[i].speed * delta;
        if (positions.array[i * 3 + 1] < 0) {
          this.resetParticle(i, positions.array);
        }
      }
    } else if (this.particleKind === "snow") {
      for (let i = 0; i < this.particleData.length; i++) {
        const d = this.particleData[i];
        positions.array[i * 3 + 1] -= d.speed * delta;
        positions.array[i * 3] +=
          Math.sin(elapsed * 0.8 + d.phase) * d.drift * delta;
        if (positions.array[i * 3 + 1] < 0) {
          this.resetParticle(i, positions.array);
        }
      }
    }

    positions.needsUpdate = true;
  }
}
