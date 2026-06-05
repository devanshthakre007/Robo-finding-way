"""
Harness for user-submitted Blender scripts.

Contract: define build() that creates mesh objects and returns the root Empty.
The runner clears the scene, calls build(), then exports everything to OUTPUT_PATH.
"""

import os
import sys

import bpy


def get_view3d_override():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type != "VIEW_3D":
                continue
            for region in area.regions:
                if region.type != "WINDOW":
                    continue
                return {
                    "window": window,
                    "screen": window.screen,
                    "area": area,
                    "region": region,
                    "scene": bpy.context.scene,
                    "view_layer": bpy.context.view_layer,
                }
    return None


class ops:
    """Use with `with ops(): bpy.ops...` when running headless."""

    def __enter__(self):
        self._override = get_view3d_override()
        if self._override:
            self._cm = bpy.context.temp_override(**self._override)
            self._cm.__enter__()
        else:
            self._cm = None
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._cm:
            self._cm.__exit__(exc_type, exc, tb)


def clear_scene():
    with ops():
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in list(bpy.data.materials):
        if block.users == 0:
            bpy.data.materials.remove(block)


def export_scene(filepath):
    folder = os.path.dirname(filepath)
    if folder:
        os.makedirs(folder, exist_ok=True)

    with ops():
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.export_scene.gltf(
            filepath=filepath,
            export_format="GLB",
            use_selection=True,
            export_apply=True,
            export_yup=True,
            export_materials="EXPORT",
        )
    print("Exported:", filepath)


def main():
    if len(sys.argv) < 3:
        raise SystemExit("Usage: blender --background --python run_user_script.py -- script.py output.glb")

    script_path = sys.argv[-2]
    output_path = os.path.abspath(sys.argv[-1])

    clear_scene()

    namespace = {"__name__": "__user_script__", "bpy": bpy, "ops": ops}
    with open(script_path, encoding="utf-8") as handle:
        code = handle.read()
    exec(compile(code, script_path, "exec"), namespace)

    builder = namespace.get("build") or namespace.get("build_model")
    if callable(builder):
        builder()

    if not any(obj.type == "MESH" for obj in bpy.context.scene.objects):
        raise RuntimeError("Script did not create any mesh objects. Define build() that adds meshes.")

    export_scene(output_path)


if __name__ == "__main__":
    main()
