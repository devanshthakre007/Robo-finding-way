/**
 * Export a Three.js Object3D to binary GLB.
 */
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function exportGlb(object3d) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object3d,
      (result) => resolve(result),
      (err) => reject(err instanceof Error ? err : new Error("GLB export failed")),
      { binary: true },
    );
  });
}
