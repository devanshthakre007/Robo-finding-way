/**
 * Modal preview for Three.js model scripts (AI-Assets-generator style).
 */
import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  GridHelper,
  Group,
  Box3,
  Vector3,
  SRGBColorSpace,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class ModelPreview {
  constructor() {
    this.modal = document.getElementById("model-preview-modal");
    this.canvas = document.getElementById("model-preview-canvas");
    this.closeBtn = document.getElementById("model-preview-close");
    this.viewer = null;

    this.closeBtn?.addEventListener("click", () => this.close());
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  normalise(model) {
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(1.5 / maxDim);
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

  ensureViewer() {
    if (this.viewer) return;

    const renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = SRGBColorSpace;

    const scene = new Scene();
    scene.background = new Color(0xeef1f7);

    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.5, 2, 3.2);

    const controls = new OrbitControls(camera, this.canvas);
    controls.enableDamping = true;
    controls.target.set(0, 0.75, 0);

    scene.add(new HemisphereLight(0xffffff, 0x666677, 0.9));
    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    scene.add(key);
    scene.add(new GridHelper(8, 16, 0xc0c4d0, 0xd8dbe4));

    const group = new Group();
    scene.add(group);

    this.viewer = { renderer, scene, camera, controls, group };
    this._animate();
  }

  _animate() {
    if (!this.viewer) return;
    this.viewer.raf = requestAnimationFrame(() => this._animate());
    this.viewer.controls.update();
    this._resize();
    this.viewer.renderer.render(this.viewer.scene, this.viewer.camera);
  }

  _resize() {
    const canvas = this.canvas;
    if (!canvas || !this.viewer) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    if (canvas.width !== w || canvas.height !== h) {
      this.viewer.renderer.setSize(w, h, false);
      this.viewer.camera.aspect = w / h;
      this.viewer.camera.updateProjectionMatrix();
    }
  }

  show(model) {
    this.ensureViewer();
    this.normalise(model);
    const g = this.viewer.group;
    while (g.children.length) g.remove(g.children[0]);
    g.add(model);
    this.modal?.classList.add("model-preview-modal--open");
  }

  close() {
    this.modal?.classList.remove("model-preview-modal--open");
  }
}
