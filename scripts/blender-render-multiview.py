"""
Multi-view photogrammetry-эх зураг үүсгэх Blender script.

Хэрэглэх заавар:
1. Blender-д GLB загвараа нээ (File → Import → glTF 2.0)
2. Scripting tab → New → энэ script-ыг хуул
3. OUTPUT_DIR-ийг өөрийн хавтас руу заа
4. Run Script (▶) дарна
5. ~30-60 секундын дотор 30 ширхэг зураг үүсэх ёстой

Үр дүн: photogrammetry-ын raw input болгож Meshroom-д оруулна.
"""

import bpy
import math
import os

# ============================================
# Тохиргоо — өөрчилж болно
# ============================================
OUTPUT_DIR = r"D:\diplom\demo\synthetic-photoset"
NUM_VIEWS = 30                  # Зургийн тоо (20-40 тохиромжтой)
RADIUS = 3.0                    # Камераас объект хүртэлх зай
HEIGHTS = [0.5, 1.2, 2.0]       # 3 өндөрт камер тойроулна
RESOLUTION_X = 1920
RESOLUTION_Y = 1080
FILE_FORMAT = "JPEG"            # эсвэл "PNG"
JPEG_QUALITY = 92
# ============================================

os.makedirs(OUTPUT_DIR, exist_ok=True)

scene = bpy.context.scene

# Render тохиргоо
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
scene.render.resolution_x = RESOLUTION_X
scene.render.resolution_y = RESOLUTION_Y
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = FILE_FORMAT
if FILE_FORMAT == "JPEG":
    scene.render.image_settings.quality = JPEG_QUALITY

# Background-ийг зөөлөн саарал болгох (photogrammetry-д feature matching сайжруулна)
bpy.context.scene.world.color = (0.85, 0.85, 0.85)

# Хуучин камер байвал устгах
for obj in list(bpy.data.objects):
    if obj.type == "CAMERA":
        bpy.data.objects.remove(obj, do_unlink=True)

# Шинэ камер үүсгэх
cam_data = bpy.data.cameras.new("MultiviewCam")
cam_obj = bpy.data.objects.new("MultiviewCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj
cam_data.lens = 35  # 35mm focal length

# Гэрэлтүүлэг — Sun light нэмэх (хэрэв байхгүй бол)
has_light = any(o.type == "LIGHT" for o in bpy.data.objects)
if not has_light:
    light_data = bpy.data.lights.new("Sun", "SUN")
    light_data.energy = 3.0
    light_obj = bpy.data.objects.new("Sun", light_data)
    light_obj.location = (4, -4, 6)
    scene.collection.objects.link(light_obj)

# Target — голын цэг (0,0,0)
target = (0, 0, 0)

def point_camera_at(cam, target):
    """Камераас target руу харуулах rotation тооцох"""
    import mathutils
    direction = mathutils.Vector(target) - cam.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam.rotation_euler = rot_quat.to_euler()

frame_index = 1
views_per_height = NUM_VIEWS // len(HEIGHTS)

for h_idx, height in enumerate(HEIGHTS):
    for i in range(views_per_height):
        angle = (i / views_per_height) * 2 * math.pi
        x = RADIUS * math.cos(angle)
        y = RADIUS * math.sin(angle)
        z = height

        cam_obj.location = (x, y, z)
        point_camera_at(cam_obj, target)

        scene.render.filepath = os.path.join(
            OUTPUT_DIR, f"view_{frame_index:03d}.jpg"
        )
        bpy.ops.render.render(write_still=True)

        print(f"  ✓ Rendered view {frame_index:03d} @ angle={math.degrees(angle):.0f}° z={z}")
        frame_index += 1

print(f"\n✓ Дууссан! {frame_index - 1} зураг үүслээ → {OUTPUT_DIR}")
print(f"  Энэ хавтсыг Meshroom руу drag-drop хийнэ.")
