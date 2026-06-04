import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import robotUrl from "../robot2.glb?url";
import { buildWanderer, buildChild, buildFriend } from "./buildHumanoid.js";
import {
  buildTree,
  buildRock,
  buildFlower,
  buildCloud,
  buildSignpost,
  buildPath,
} from "./world.js";
import { SpeechBubbles } from "./speechBubbles.js";
import { Timeline, Director } from "./storyPlayer.js";
import { LAYOUT, buildStory } from "./story.js";

// going-home "dawn" chapter palette — same as the 3d-dog story engine
const CHAPTER = { sky: "#E8D5F2", ground: "#C5E1C5", fog: "#E8D5F2" };

const HERO_HEIGHT = 1.5;
const ADULT_HEIGHT = 1.7;
const CHILD_HEIGHT = 1.15;

const container = document.getElementById("canvas-container");
const loadingEl = document.getElementById("loading");
const storyLayer = document.getElementById("story-layer");

// ── Renderer / scene / camera ─────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(CHAPTER.sky);
scene.fog = new THREE.Fog(CHAPTER.fog, 12, 34);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  120,
);
camera.position.set(0, 3.6, 12.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false; // driven by the story; freed when it ends
controls.target.set(0, 1, 5);

// ── Lights ─────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.62));

const key = new THREE.DirectionalLight(0xfff6ec, 0.95);
key.position.set(6, 12, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 50;
key.shadow.camera.left = -20;
key.shadow.camera.right = 20;
key.shadow.camera.top = 20;
key.shadow.camera.bottom = -20;
scene.add(key);

scene.add(new THREE.HemisphereLight(CHAPTER.sky, CHAPTER.ground, 0.45));

// ── Ground + path + scenery ─────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: CHAPTER.ground, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pathPoints = [
  LAYOUT.heroStart,
  LAYOUT.wp1,
  LAYOUT.wp2,
  LAYOUT.wp3,
  LAYOUT.friend,
].map((p) => new THREE.Vector3(p.x, 0, p.z));
scene.add(buildPath(pathPoints, { width: 1.2 }));

function place(obj, x, z, rotY = 0) {
  obj.position.set(x, 0, z);
  obj.rotation.y = rotY;
  scene.add(obj);
  return obj;
}

// Trees framing the path
place(buildTree({ leafColor: 0x9ccc65 }), -4.5, 3.5);
place(buildTree({ leafColor: 0x81c784, height: 1.2 }), 4.6, -1.5);
place(buildTree({ conical: true, leafColor: 0x66bb6a }), -4.8, -2.5);
place(buildTree({ leafColor: 0xa5d6a7 }), 4.2, -6.5);
place(buildTree({ conical: true, leafColor: 0x7cb342, height: 1.1 }), -4.4, -8.5);
place(buildTree({ leafColor: 0xc5e1a5 }), -4.2, 9.0);

// Rocks + signpost
place(buildRock({ size: 0.9 }), 2.6, 4.6);
place(buildRock({ size: 1.3, color: 0xb0bec5 }), -3.0, -6.0);
place(buildSignpost(), 1.7, 3.6, 0.4);

// A scatter of flowers along the meadow
const flowerColors = [0xf48fb1, 0xfff176, 0xb39ddb, 0xff8a65, 0x80deea];
for (let i = 0; i < 40; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 2.5 + Math.random() * 12;
  const x = Math.cos(angle) * radius;
  const z = -3 + Math.sin(angle) * radius;
  if (Math.abs(x) < 1.4 && z > -9 && z < 7) continue; // keep the path clear
  const f = buildFlower({
    petalColor: flowerColors[i % flowerColors.length],
  });
  f.rotation.y = Math.random() * Math.PI;
  place(f, x, z);
}

// Drifting clouds
const clouds = [];
for (let i = 0; i < 6; i++) {
  const c = buildCloud({ scale: 0.9 + Math.random() * 0.8 });
  c.position.set(-14 + Math.random() * 28, 7 + Math.random() * 3, -14 + Math.random() * 12);
  c.userData.speed = 0.25 + Math.random() * 0.35;
  scene.add(c);
  clouds.push(c);
}

// ── Actor factory ────────────────────────────────────────────────────────────
function makeActor(model, targetHeight) {
  const wrapper = new THREE.Group();
  wrapper.add(model);

  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = targetHeight / size.y;
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;

  wrapper.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return wrapper;
}

// ── Static NPCs (built immediately) ────────────────────────────────────────────
const wanderer = makeActor(buildWanderer(), ADULT_HEIGHT);
place(wanderer, LAYOUT.wanderer.x, LAYOUT.wanderer.z, Math.PI);

const child = makeActor(buildChild(), CHILD_HEIGHT);
place(child, LAYOUT.child.x, LAYOUT.child.z, Math.PI * 0.5);

const friend = makeActor(buildFriend(), ADULT_HEIGHT);
place(friend, LAYOUT.friend.x, LAYOUT.friend.z, Math.PI);

// ── Story plumbing ──────────────────────────────────────────────────────────────
const bubbles = new SpeechBubbles(storyLayer);
const timeline = new Timeline();
const director = new Director({ timeline, camera, controls, bubbles });

const ui = {
  titleCard: document.getElementById("title-card"),
  titleText: document.getElementById("title-text"),
  titleSub: document.getElementById("title-sub"),
  endCard: document.getElementById("end-card"),
  endText: document.getElementById("end-text"),
  replay: document.getElementById("replay"),
  showTitle(text, sub = "A 25-second journey") {
    this.titleText.textContent = text;
    this.titleSub.textContent = sub;
    this.titleCard.classList.add("show");
  },
  hideTitle() {
    this.titleCard.classList.remove("show");
  },
  showEnd(text) {
    this.endText.textContent = text;
    this.endCard.classList.add("show");
  },
  hideEnd() {
    this.endCard.classList.remove("show");
  },
  showReplay() {
    this.replay.classList.add("show");
  },
  hideReplay() {
    this.replay.classList.remove("show");
  },
};

// snapshot of initial transforms so replay restores everything
let initialState = [];
function snapshot(objs) {
  initialState = objs.map((o) => ({
    obj: o,
    pos: o.position.clone(),
    quat: o.quaternion.clone(),
  }));
}
function restore() {
  for (const s of initialState) {
    s.obj.position.copy(s.pos);
    s.obj.quaternion.copy(s.quat);
  }
}

const clock = new THREE.Clock();

function startStory() {
  bubbles.clear();
  ui.hideEnd();
  ui.hideReplay();
  restore();
  controls.enabled = false;
  timeline.reset();
  timeline.play();
}

timeline.onComplete = () => {
  controls.target.set(LAYOUT.wp3.x, 1.0, LAYOUT.wp3.z);
  controls.enabled = true;
  ui.showReplay();
};

ui.replay.addEventListener("click", startStory);

// ── Load the hero (robot) then assemble + play ─────────────────────────────────
const loader = new GLTFLoader();
loader.load(
  robotUrl,
  (gltf) => {
    const model = gltf.scene;
    model.rotation.x = Math.PI / 2; // robot2.glb is authored on its side
    const hero = makeActor(model, HERO_HEIGHT);
    place(hero, LAYOUT.heroStart.x, LAYOUT.heroStart.z);

    snapshot([hero, wanderer, child, friend]);

    buildStory(director, { hero, wanderer, child, friend }, ui);

    loadingEl.classList.add("hidden");
    startStory();
  },
  undefined,
  (err) => {
    console.error(err);
    loadingEl.textContent = "Failed to load robot2.glb";
  },
);

// ── Resize + render loop ────────────────────────────────────────────────────────
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  timeline.update(delta);

  for (const c of clouds) {
    c.position.x += c.userData.speed * delta;
    if (c.position.x > 16) c.position.x = -16;
  }

  if (controls.enabled) controls.update();
  bubbles.update(camera, renderer);
  renderer.render(scene, camera);
}
animate();
