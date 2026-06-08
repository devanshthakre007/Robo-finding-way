/**
 * Full-page model preview scene — studio lighting + orbit camera.
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
  GridHelper,
  Group,
  Box3,
  Vector3,
} from "three";

export default class ModelView {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.modelGroup = new Group();
    this.scene.add(this.modelGroup);
    this.buildStudio();
  }

  buildStudio() {
    this.scene.background = new Color(0xe8ecf4);
    this.scene.fog = new Fog(0xe8ecf4, 18, 45);

    this.ground = new Mesh(
      new PlaneGeometry(40, 40),
      new MeshStandardMaterial({ color: 0xd8dce8, roughness: 0.95 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const grid = new GridHelper(20, 40, 0xb8bcc8, 0xc8ccd8);
    grid.position.y = 0.01;
    this.scene.add(grid);

    this.ambientLight = new AmbientLight(0xffffff, 0.55);
    this.scene.add(this.ambientLight);

    this.keyLight = new DirectionalLight(0xffffff, 1.2);
    this.keyLight.position.set(5, 8, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.keyLight);

    this.hemiLight = new HemisphereLight(0xe8ecf4, 0x9aa0b0, 0.5);
    this.scene.add(this.hemiLight);
  }

  normalise(model) {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(2.2 / maxDim);
    model.updateMatrixWorld(true);
    const box2 = new Box3().setFromObject(model);
    model.position.y -= box2.min.y;
    model.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }

  show(object3d) {
    while (this.modelGroup.children.length) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }

    const model = object3d.clone(true);
    this.normalise(model);
    this.modelGroup.add(model);

    const cam = this.experience.camera;
    if (cam) {
      cam.instance.position.set(3.2, 2.2, 4.5);
      cam.controls.target.set(0, 1, 0);
      cam.controls.enabled = true;
      cam.controls.update();
    }
  }

  clear() {
    while (this.modelGroup.children.length) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
  }
}
