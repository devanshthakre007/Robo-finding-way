import bpy

def build():
    with ops():
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0,0,0.3))
