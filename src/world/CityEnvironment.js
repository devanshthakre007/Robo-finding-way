/**
 * Scene 2 environment — lights + ground refs for weather control.
 */
import {
  Color,
  Fog,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
} from "three";

export default class CityEnvironment {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    this.skyColor = new Color(0x7db8e8);
    this.scene.background = this.skyColor;
    this.scene.fog = new Fog(0x7db8e8, 20, 55);

    this.groundMaterial = new MeshStandardMaterial({
      color: 0x9e9e9e,
      roughness: 0.9,
    });
    this.ground = new Mesh(new PlaneGeometry(80, 80), this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.ambientLight = new AmbientLight(0xfff8f0, 0.75);
    this.scene.add(this.ambientLight);

    this.sun = new DirectionalLight(0xfff6e0, 1.4);
    this.sun.position.set(8, 18, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 60;
    this.sun.shadow.camera.left = -25;
    this.sun.shadow.camera.right = 25;
    this.sun.shadow.camera.top = 25;
    this.sun.shadow.camera.bottom = -25;
    this.scene.add(this.sun);

    this.hemiLight = new HemisphereLight(0x7db8e8, 0x9e9e9e, 0.55);
    this.scene.add(this.hemiLight);
  }
}
