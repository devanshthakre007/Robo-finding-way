/**
 * Dev-server API — run Blender scripts, save models to models/library/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MODELS_DIR = path.join(ROOT, "models", "library");
const MANIFEST_PATH = path.join(MODELS_DIR, "manifest.json");
const SCRIPTS_DIR = path.join(ROOT, "models", "scripts");
const RUNNER_PATH = path.join(ROOT, "blender", "run_user_script.py");
const BLENDER_TIMEOUT_MS = 180_000;

const BLENDER_CANDIDATES = [
  process.env.BLENDER_PATH,
  "blender",
  "/Applications/Blender.app/Contents/MacOS/Blender",
  "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe",
].filter(Boolean);

function pathname(req) {
  return (req.url || "").split("?")[0];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function ensureDirs() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST_PATH)) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ models: [] }, null, 2));
  }
}

function readManifest() {
  ensureDirs();
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function writeManifest(manifest) {
  ensureDirs();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function findBlender() {
  for (const candidate of BLENDER_CANDIDATES) {
    if (!candidate) continue;
    if (candidate.includes(path.sep) || candidate.includes("/")) {
      if (fs.existsSync(candidate)) return candidate;
      continue;
    }
    try {
      const resolved = execSync(`which ${candidate}`, { encoding: "utf8" }).trim();
      if (resolved && fs.existsSync(resolved)) return resolved;
    } catch {
      // not on PATH
    }
  }
  return null;
}

function runBlender(scriptPath, outputPath) {
  const blender = findBlender();
  if (!blender) {
    return Promise.reject(
      new Error(
        "Blender not found. Install Blender or set BLENDER_PATH in your environment.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    const args = ["--background", "--python", RUNNER_PATH, "--", scriptPath, outputPath];
    const proc = spawn(blender, args, { cwd: ROOT });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(result);
    };

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      finish(new Error("Blender timed out after 3 minutes."));
    }, BLENDER_TIMEOUT_MS);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", (err) => {
      finish(new Error(`Failed to start Blender: ${err.message}`));
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        finish(new Error(stderr.trim() || stdout.trim() || `Blender exited with code ${code}`));
        return;
      }
      if (!fs.existsSync(outputPath)) {
        finish(
          new Error("Blender finished but no .glb was produced. Define build() in your script."),
        );
        return;
      }
      finish(null, { stdout, stderr });
    });
  });
}

async function createBlenderModel({ name, script }) {
  const id = randomUUID().slice(0, 8);
  const scriptPath = path.join(SCRIPTS_DIR, `${id}.py`);
  const outputPath = path.join(MODELS_DIR, `${id}.glb`);

  fs.writeFileSync(scriptPath, script, "utf8");
  await runBlender(scriptPath, outputPath);

  const entry = {
    id,
    name: name || `Model ${id}`,
    type: "blender",
    file: `${id}.glb`,
    scriptFile: `${id}.py`,
    createdAt: new Date().toISOString(),
  };

  const manifest = readManifest();
  manifest.models.unshift(entry);
  writeManifest(manifest);

  return entry;
}

function createThreeJsModel({ name, script }) {
  const id = randomUUID().slice(0, 8);
  const scriptPath = path.join(SCRIPTS_DIR, `${id}.js`);
  fs.writeFileSync(scriptPath, script, "utf8");

  const entry = {
    id,
    name: name || `Model ${id}`,
    type: "threejs",
    scriptFile: `${id}.js`,
    createdAt: new Date().toISOString(),
  };

  const manifest = readManifest();
  manifest.models.unshift(entry);
  writeManifest(manifest);

  return entry;
}

function getModel(id) {
  const manifest = readManifest();
  return manifest.models.find((m) => m.id === id) || null;
}

function deleteModel(id) {
  const manifest = readManifest();
  const index = manifest.models.findIndex((m) => m.id === id);
  if (index === -1) return false;

  const [removed] = manifest.models.splice(index, 1);
  writeManifest(manifest);

  if (removed.file) {
    const glbPath = path.join(MODELS_DIR, removed.file);
    if (fs.existsSync(glbPath)) fs.unlinkSync(glbPath);
  }
  if (removed.scriptFile) {
    const scriptPath = path.join(SCRIPTS_DIR, removed.scriptFile);
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
  }

  return true;
}

function sendFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "File not found." });
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  fs.createReadStream(filePath).pipe(res);
}

export function createModelApiMiddleware() {
  ensureDirs();

  return async (req, res, next) => {
    const route = pathname(req);
    if (!route.startsWith("/api/models")) return next();

    try {
      if (req.method === "GET" && route === "/api/models") {
        sendJson(res, 200, readManifest());
        return;
      }

      if (req.method === "GET" && route === "/api/models/blender-status") {
        sendJson(res, 200, { available: Boolean(findBlender()), path: findBlender() });
        return;
      }

      const fileMatch = route.match(/^\/api\/models\/([^/]+)\/file$/);
      if (req.method === "GET" && fileMatch) {
        const model = getModel(fileMatch[1]);
        if (!model?.file) {
          sendJson(res, 404, { error: "Model file not found." });
          return;
        }
        sendFile(res, path.join(MODELS_DIR, model.file), "model/gltf-binary");
        return;
      }

      const scriptMatch = route.match(/^\/api\/models\/([^/]+)\/script$/);
      if (req.method === "GET" && scriptMatch) {
        const model = getModel(scriptMatch[1]);
        if (!model?.scriptFile) {
          sendJson(res, 404, { error: "Script not found." });
          return;
        }
        const scriptPath = path.join(SCRIPTS_DIR, model.scriptFile);
        if (!fs.existsSync(scriptPath)) {
          sendJson(res, 404, { error: "Script file missing on disk." });
          return;
        }
        sendJson(res, 200, {
          id: model.id,
          name: model.name,
          type: model.type,
          script: fs.readFileSync(scriptPath, "utf8"),
        });
        return;
      }

      if (req.method === "POST" && route === "/api/models") {
        const body = await readBody(req);
        const { name, type, script } = body;

        if (!script?.trim()) {
          sendJson(res, 400, { error: "Script is required." });
          return;
        }

        let entry;
        if (type === "blender") {
          entry = await createBlenderModel({ name, script });
        } else if (type === "threejs") {
          entry = createThreeJsModel({ name, script });
        } else {
          sendJson(res, 400, { error: 'type must be "blender" or "threejs".' });
          return;
        }

        sendJson(res, 200, { model: entry });
        return;
      }

      const deleteMatch = route.match(/^\/api\/models\/([^/]+)$/);
      if (req.method === "DELETE" && deleteMatch) {
        const ok = deleteModel(deleteMatch[1]);
        sendJson(res, ok ? 200 : 404, { ok });
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      sendJson(res, 500, { error: err.message || "Server error" });
    }
  };
}
