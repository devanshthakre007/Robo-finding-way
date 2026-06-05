/**
 * Scene atmosphere — Three.js Journey Ch.02 §14–16 (Lights, Shadows, Haunted House).
 */
import {
  Scene,
  Color,
  Fog,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
} from "three";

export const CHAPTER = {
  sky: "#E8D5F2",
  ground: "#C5E1C5",
  fog: "#E8D5F2",
};

export default class Environment {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    this.setBackground();
    this.setGround();
    this.setLights();
  }

  setBackground() {
    this.skyColor = new Color(CHAPTER.sky);
    this.scene.background = this.skyColor;
    this.scene.fog = new Fog(CHAPTER.fog, 12, 34);
  }

  setGround() {
    this.groundMaterial = new MeshStandardMaterial({
      color: CHAPTER.ground,
      roughness: 1,
    });
    this.ground = new Mesh(new PlaneGeometry(80, 80), this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  setLights() {
    this.ambientLight = new AmbientLight(0xffffff, 0.62);
    this.scene.add(this.ambientLight);

    this.sun = new DirectionalLight(0xfff6ec, 0.95);
    this.sun.position.set(6, 12, 8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 50;
    this.sun.shadow.camera.left = -20;
    this.sun.shadow.camera.right = 20;
    this.sun.shadow.camera.top = 20;
    this.sun.shadow.camera.bottom = -20;
    this.scene.add(this.sun);

    this.hemiLight = new HemisphereLight(CHAPTER.sky, CHAPTER.ground, 0.45);
    this.scene.add(this.hemiLight);
  }
}
