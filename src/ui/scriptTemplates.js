export const BLENDER_TEMPLATE = `"""Blender model script — define build() to create meshes."""

import bpy


def make_material(name, rgba):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.8
    return mat


def build():
    skin = make_material("skin", (0.96, 0.82, 0.74, 1.0))
    shirt = make_material("shirt", (0.45, 0.62, 0.88, 1.0))

    with ops():
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.2, location=(0, 0, 1.6))
        head = bpy.context.active_object
        head.data.materials.append(skin)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.6, location=(0, 0, 1.0))
        torso = bpy.context.active_object
        torso.data.materials.append(shirt)

        bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
        root = bpy.context.active_object
    root.name = "CustomModel"
    head.parent = root
    torso.parent = root
    return root
`;

export const THREEJS_TEMPLATE = `/**
 * Three.js model script — define buildModel(THREE).
 * Return a Group or Object3D.
 */
function buildModel(THREE) {
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: 0xf5cba7, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.7 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), skin);
  head.position.y = 1.56;
  head.castShadow = true;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.65, 16), shirt);
  torso.position.y = 1.0;
  torso.castShadow = true;

  group.add(head, torso);
  return group;
}
`;
