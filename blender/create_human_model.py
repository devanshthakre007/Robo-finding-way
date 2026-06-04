"""
Blender script: build a simple stylized human, same height as robot2.glb.

Measured from robot2.glb (upright in Three.js after +90° X): height = 2.02.

Run inside Blender:
  blender --background --python create_human_model.py

Or: Scripting workspace → Open this file → Run Script.

Output: ../human.glb (next to the Moving-model folder root)
"""

import math
import os

import bpy
from mathutils import Vector

# Same total height as robot2.glb (Blender units ≈ meters)
TARGET_HEIGHT = 2.02
OUTPUT_NAME = "human.glb"

COLORS = {
    "skin": (0.96, 0.82, 0.74, 1.0),
    "shirt": (0.45, 0.62, 0.88, 1.0),
    "pants": (0.35, 0.38, 0.52, 1.0),
    "hair": (0.28, 0.22, 0.18, 1.0),
    "shoes": (0.92, 0.92, 0.94, 1.0),
}


def get_view3d_override():
    """bpy.ops needs a 3D View context when run from the Text Editor."""
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


def ops():
    """Context manager helper — use: `with ops(): bpy.ops...`"""
    return _OpsContext()


class _OpsContext:
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


def make_material(name, rgba):
    mat = bpy.data.materials.new(name=name)
    tree = mat.node_tree
    if tree is None:
        return mat
    nodes = tree.nodes
    links = tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.85
    spec = bsdf.inputs.get("Specular IOR Level") or bsdf.inputs.get("Specular")
    if spec is not None:
        spec.default_value = 0.2
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def assign_material(obj, mat):
    if obj.type != "MESH":
        return
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_capsule(
    name,
    radius,
    depth,
    location,
    rotation=(0.0, 0.0, 0.0),
    segments=16,
    rings=8,
):
    with ops():
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=segments,
            ring_count=rings,
            radius=radius,
            location=location,
            rotation=rotation,
        )
        obj = bpy.context.active_object
        obj.scale = (1.0, 1.0, depth / (2.0 * radius))
        bpy.ops.object.transform_apply(scale=True)
    obj.name = name
    return obj


def add_box(name, size, location):
    with ops():
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
        obj = bpy.context.active_object
        obj.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
        bpy.ops.object.transform_apply(scale=True)
    obj.name = name
    return obj


def world_bounds(objects):
    mins = Vector((math.inf, math.inf, math.inf))
    maxs = Vector((-math.inf, -math.inf, -math.inf))
    bpy.context.view_layer.update()
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
    return mins, maxs


def build_human():
    """Build human on Z=0, scale root to TARGET_HEIGHT."""
    mats = {key: make_material(key, rgba) for key, rgba in COLORS.items()}
    parts = []

    H = 1.0
    foot_h = 0.05 * H
    leg_lower = 0.24 * H
    leg_upper = 0.24 * H
    pelvis_h = 0.12 * H
    torso_h = 0.28 * H
    neck_h = 0.04 * H
    head_r = 0.11 * H

    z = 0.0

    foot_size = (0.22 * H, 0.1 * H, foot_h)
    for side, x in (("L", -0.09 * H), ("R", 0.09 * H)):
        foot = add_box("Foot_" + side, foot_size, (x, 0.02 * H, z + foot_h / 2))
        assign_material(foot, mats["shoes"])
        parts.append(foot)
    z += foot_h

    lower_r = 0.075 * H
    for side, x in (("L", -0.09 * H), ("R", 0.09 * H)):
        leg = add_capsule(
            "LegLower_" + side, lower_r, leg_lower, (x, 0.0, z + leg_lower / 2)
        )
        assign_material(leg, mats["pants"])
        parts.append(leg)
    z += leg_lower

    upper_r = 0.085 * H
    for side, x in (("L", -0.09 * H), ("R", 0.09 * H)):
        leg = add_capsule(
            "LegUpper_" + side, upper_r, leg_upper, (x, 0.0, z + leg_upper / 2)
        )
        assign_material(leg, mats["pants"])
        parts.append(leg)
    z += leg_upper

    pelvis = add_box("Pelvis", (0.34 * H, 0.2 * H, pelvis_h), (0.0, 0.0, z + pelvis_h / 2))
    assign_material(pelvis, mats["pants"])
    parts.append(pelvis)
    z += pelvis_h

    torso = add_capsule("Torso", 0.16 * H, torso_h, (0.0, 0.0, z + torso_h / 2))
    assign_material(torso, mats["shirt"])
    parts.append(torso)
    z += torso_h

    neck = add_capsule("Neck", 0.05 * H, neck_h, (0.0, 0.0, z + neck_h / 2))
    assign_material(neck, mats["skin"])
    parts.append(neck)
    z += neck_h

    with ops():
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=12,
            radius=head_r,
            location=(0.0, 0.0, z + head_r),
        )
        head = bpy.context.active_object
    head.name = "Head"
    assign_material(head, mats["skin"])
    parts.append(head)

    with ops():
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=10,
            radius=head_r * 1.05,
            location=(0.0, -0.02 * H, z + head_r * 1.05),
        )
        hair = bpy.context.active_object
        hair.scale = (1.0, 0.92, 0.88)
        bpy.ops.object.transform_apply(scale=True)
    hair.name = "Hair"
    assign_material(hair, mats["hair"])
    parts.append(hair)

    shoulder_z = z - neck_h - torso_h * 0.15
    arm_upper = 0.22 * H
    arm_lower = 0.2 * H
    arm_r = 0.055 * H

    for side, x_sign in (("L", -1), ("R", 1)):
        sx = x_sign * 0.22 * H
        upper = add_capsule(
            "ArmUpper_" + side,
            arm_r,
            arm_upper,
            (sx, 0.0, shoulder_z - arm_upper / 2),
            rotation=(0.0, 0.0, x_sign * 0.35),
        )
        assign_material(upper, mats["shirt"])
        parts.append(upper)

        elbow = Vector(upper.location) + Vector(
            (x_sign * 0.08 * H, 0.0, -arm_upper * 0.85)
        )
        lower = add_capsule(
            "ArmLower_" + side,
            arm_r * 0.9,
            arm_lower,
            (elbow.x, elbow.y, elbow.z),
            rotation=(0.25, 0.0, x_sign * 0.2),
        )
        assign_material(lower, mats["skin"])
        parts.append(lower)

        hand = add_capsule(
            "Hand_" + side,
            arm_r * 0.75,
            0.08 * H,
            (
                elbow.x + x_sign * 0.03 * H,
                elbow.y,
                elbow.z - arm_lower * 0.95,
            ),
        )
        assign_material(hand, mats["skin"])
        parts.append(hand)

    with ops():
        bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0.0, 0.0, 0.0))
        root = bpy.context.active_object
    root.name = "Human"

    for obj in parts:
        obj.parent = root

    bpy.context.view_layer.update()
    mins, maxs = world_bounds(parts)
    height = maxs.z - mins.z
    if height < 1e-6:
        raise RuntimeError("Human mesh has zero height")

    scale_factor = TARGET_HEIGHT / height
    root.scale = (scale_factor, scale_factor, scale_factor)

    bpy.context.view_layer.update()
    mins, maxs = world_bounds(parts)
    root.location.z -= mins.z

    bpy.context.view_layer.update()
    mins, maxs = world_bounds(parts)
    final_h = maxs.z - mins.z
    print("Human height: %.4f (target %.2f)" % (final_h, TARGET_HEIGHT))

    return root, parts


def export_glb(root, parts, filepath):
    folder = os.path.dirname(filepath)
    if folder:
        os.makedirs(folder, exist_ok=True)

    with ops():
        bpy.ops.object.select_all(action="DESELECT")
        root.select_set(True)
        for obj in parts:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = root

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
    clear_scene()
    root, parts = build_human()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    if not script_dir:
        script_dir = os.getcwd()
    out_path = os.path.join(script_dir, "..", OUTPUT_NAME)
    export_glb(root, parts, os.path.abspath(out_path))


if __name__ == "__main__":
    main()
