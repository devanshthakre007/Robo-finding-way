/**
 * Execute a user Three.js script that defines buildModel(THREE).
 */
import * as THREE from "three";

export function runThreeJsScript(script) {
  const wrapped = `
    ${script}
    if (typeof buildModel !== "function") {
      throw new Error("Three.js scripts must define buildModel(THREE) returning a Group or Object3D.");
    }
    return buildModel(THREE);
  `;

  const build = new Function("THREE", wrapped);
  const result = build(THREE);

  if (!result?.isObject3D) {
    throw new Error("buildModel(THREE) must return a Three.js Object3D.");
  }

  return result.clone(true);
}
