/**
 * Asset loading with progress — Three.js Journey Ch.05 §47 (Intro & Loading Progress).
 */
import { LoadingManager } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Resources {
  constructor(sources) {
    this.sources = sources;
    this.items = {};

    this.onProgress = null;
    this.onReady = null;
    this.onError = null;

    this.loadingManager = new LoadingManager(
      () => {
        if (this.onReady) this.onReady(this.items);
      },
      (url, loaded, total) => {
        const ratio = total > 0 ? loaded / total : 1;
        if (this.onProgress) this.onProgress(ratio, url);
      },
      (url) => {
        if (this.onError) this.onError(url);
      },
    );

    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.loadAll();
  }

  loadAll() {
    for (const source of this.sources) {
      if (source.type === "gltfModel") {
        this.gltfLoader.load(source.path, (file) => {
          this.items[source.name] = file;
        });
      }
    }
  }
}
