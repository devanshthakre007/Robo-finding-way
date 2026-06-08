/**
 * Client API for the model library (backend-only storage).
 */

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.ok
        ? "Empty server response."
        : `Server error (${res.status}). Restart the dev server: npm run dev`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response: ${text.slice(0, 160)}`);
  }
}

export async function fetchModels() {
  const res = await fetch("/api/models");
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to load models");
  return data;
}

export async function fetchBlenderStatus() {
  const res = await fetch("/api/models/blender-status");
  if (!res.ok) return { available: false };
  return parseJsonResponse(res);
}

export async function fetchModelScript(id) {
  const res = await fetch(`/api/models/${id}/script`);
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to load script");
  return data;
}

export function modelFileUrl(id) {
  return `/api/models/${id}/file`;
}

export async function createModel({ name, type, script }) {
  const res = await fetch("/api/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, script }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to create model");
  return data.model;
}

export async function deleteModel(id) {
  const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to delete model");
  return data;
}

export async function saveAIAssetModel({ name, category, glbBuffer }) {
  const params = new URLSearchParams({
    name,
    category: category || "custom",
  });
  const res = await fetch(`/ai-assets/save-model?${params}`, {
    method: "POST",
    headers: { "Content-Type": "model/gltf-binary" },
    body: glbBuffer,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to save AI asset");
  return data;
}

export async function fetchAIAssets() {
  const res = await fetch("/ai-assets/manifest.json");
  if (!res.ok) throw new Error("Failed to load AI assets");
  return res.json();
}

export async function saveToAIAssets({ name, category, glb }) {
  const res = await fetch(
    `/ai-assets/save-model?name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`,
    {
      method: "POST",
      headers: { "Content-Type": "model/gltf-binary" },
      body: glb,
    },
  );
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to save to AI assets");
  return data;
}
