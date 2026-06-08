/**
 * Loader for AI-Assets-generator models served via /ai-assets/*.
 */
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = {};

export function loadAIAsset(tag) {
  if (cache[tag]) return Promise.resolve(cache[tag]);
  return new Promise((resolve, reject) => {
    loader.load(
      `/ai-assets/models/${tag}.glb`,
      (gltf) => {
        cache[tag] = gltf;
        resolve(gltf);
      },
      undefined,
      reject,
    );
  });
}

export async function loadAIAssets(tags) {
  const results = await Promise.all(tags.map((t) => loadAIAsset(t)));
  const map = {};
  tags.forEach((t, i) => (map[t] = results[i]));
  return map;
}
