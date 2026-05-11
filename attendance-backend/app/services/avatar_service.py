"""
Local 3D avatar generation service.

Generates a personalized GLB avatar on-device using trimesh.
No external API required — works completely offline.

Each employee gets a unique avatar with:
  - Skin tone extracted from their face photo (if available)
  - Unique accent color derived from their name
  - Head, torso, arms, eyes, and mouth features

GLBs are generated once, cached on disk and in the DB.
"""

import colorsys
import hashlib
import logging
import os
from typing import Optional, Tuple

import numpy as np
from sqlalchemy.orm import Session

from app.models import Employee

logger = logging.getLogger(__name__)

AVATAR_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads",
    "avatars",
)
FACES_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads",
    "faces",
)
os.makedirs(AVATAR_DIR, exist_ok=True)


# ─── Public API ──────────────────────────────────────────────────────────────

def get_cached_avatar_url(db: Session, employee_id: str) -> Optional[str]:
    """Fast lookup — single-column SELECT, <5ms."""
    import uuid as uuid_mod
    try:
        emp_uuid = uuid_mod.UUID(employee_id)
    except ValueError:
        return None
    row = db.query(Employee.avatar_glb_url).filter(Employee.id == emp_uuid).first()
    return row[0] if row and row[0] else None


def generate_avatar_from_photo(
    db: Session,
    employee_id: str,
    image_bytes: Optional[bytes] = None,  # kept for API compat, unused
) -> Optional[str]:
    """
    Generate and cache a 3D avatar GLB for an employee.
    Returns the relative URL path (e.g. /uploads/avatars/<id>.glb).
    """
    import uuid as uuid_mod
    try:
        emp_uuid = uuid_mod.UUID(employee_id)
    except ValueError:
        return None

    emp = (
        db.query(Employee)
        .filter(Employee.id == emp_uuid, Employee.is_active == True)
        .first()
    )
    if not emp:
        return None

    # Already cached
    if emp.avatar_glb_url:
        return emp.avatar_glb_url

    try:
        # Try to extract skin tone from the employee's face photo
        skin_tone = _extract_skin_tone(employee_id)
        glb_bytes = _generate_avatar_glb(emp.name, skin_tone=skin_tone)
        glb_path = os.path.join(AVATAR_DIR, f"{employee_id}.glb")
        with open(glb_path, "wb") as f:
            f.write(glb_bytes)

        relative_url = f"/uploads/avatars/{employee_id}.glb"
        emp.avatar_glb_url = relative_url
        db.commit()
        logger.info("Avatar generated for employee %s (skin_tone=%s)", employee_id, skin_tone is not None)
        return relative_url
    except Exception:
        logger.exception("Avatar generation failed for employee %s", employee_id)
        return None


def regenerate_avatar(db: Session, employee_id: str) -> Optional[str]:
    """Force-regenerate avatar (e.g. after face re-registration)."""
    import uuid as uuid_mod
    try:
        emp_uuid = uuid_mod.UUID(employee_id)
    except ValueError:
        return None

    emp = (
        db.query(Employee)
        .filter(Employee.id == emp_uuid, Employee.is_active == True)
        .first()
    )
    if not emp:
        return None

    # Clear cached URL to force regeneration
    emp.avatar_glb_url = None
    db.commit()

    return generate_avatar_from_photo(db, employee_id)


def generate_avatar_background(employee_id: str) -> None:
    """
    Background task wrapper — creates its own DB session.
    Safe to call from FastAPI BackgroundTasks.
    """
    from app.db.base import SessionLocal
    db = SessionLocal()
    try:
        generate_avatar_from_photo(db, employee_id)
    except Exception:
        logger.exception("Background avatar generation failed for %s", employee_id)
    finally:
        db.close()


# ─── Skin Tone Extraction ────────────────────────────────────────────────────

def _extract_skin_tone(employee_id: str) -> Optional[Tuple[int, int, int]]:
    """
    Extract dominant skin tone from the employee's front-facing photo.
    Returns (R, G, B) tuple or None if no photo found.
    """
    try:
        from PIL import Image

        # Look for the front face photo
        front_path = os.path.join(FACES_DIR, employee_id, "front.jpg")
        if not os.path.exists(front_path):
            # Try any available photo
            emp_dir = os.path.join(FACES_DIR, employee_id)
            if os.path.isdir(emp_dir):
                for f in os.listdir(emp_dir):
                    if f.endswith(('.jpg', '.jpeg', '.png')):
                        front_path = os.path.join(emp_dir, f)
                        break
                else:
                    return None
            else:
                return None

        img = Image.open(front_path).convert("RGB")
        img_array = np.array(img)

        # Sample the center region (face area)
        h, w = img_array.shape[:2]
        cy, cx = h // 2, w // 2
        # Take center 40% of the image
        y1, y2 = int(cy - h * 0.2), int(cy + h * 0.2)
        x1, x2 = int(cx - w * 0.2), int(cx + w * 0.2)
        center_region = img_array[y1:y2, x1:x2]

        # Filter for skin-like pixels using HSV range
        # Skin in RGB typically: R > 80, G > 30, R > G, R > B
        r, g, b = center_region[:, :, 0], center_region[:, :, 1], center_region[:, :, 2]
        skin_mask = (r > 60) & (g > 20) & (r > g) & (np.abs(r.astype(int) - b.astype(int)) > 10)

        if skin_mask.sum() > 50:
            skin_pixels = center_region[skin_mask]
            # Use median for robust skin tone estimate
            median_color = np.median(skin_pixels, axis=0).astype(int)
            return (int(median_color[0]), int(median_color[1]), int(median_color[2]))

        # Fallback: use center pixel average
        avg = center_region.mean(axis=(0, 1)).astype(int)
        return (int(avg[0]), int(avg[1]), int(avg[2]))

    except Exception:
        logger.debug("Skin tone extraction failed for %s", employee_id)
        return None


# ─── GLB Generator ───────────────────────────────────────────────────────────

def _name_to_rgba(name: str) -> np.ndarray:
    """Derive a unique pleasant color (RGBA uint8) from an employee name."""
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    hue = (h % 3600) / 3600.0
    r, g, b = colorsys.hsv_to_rgb(hue, 0.65, 0.92)
    return np.array([int(r * 255), int(g * 255), int(b * 255), 255], dtype=np.uint8)


def _skin_to_rgba(skin_tone: Optional[Tuple[int, int, int]]) -> np.ndarray:
    """Convert extracted skin tone to RGBA, with slight warmth boost."""
    if skin_tone is None:
        # Default warm medium skin tone
        return np.array([210, 170, 135, 255], dtype=np.uint8)
    r, g, b = skin_tone
    # Clamp and slightly boost warmth
    r = min(255, int(r * 1.05))
    g = min(255, int(g * 1.0))
    b = min(255, int(b * 0.95))
    return np.array([r, g, b, 255], dtype=np.uint8)


def _colorize(mesh, rgba: np.ndarray):
    """Apply a flat vertex color to every vertex of a trimesh mesh."""
    import trimesh.visual
    colors = np.tile(rgba, (len(mesh.vertices), 1))
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=colors)
    return mesh


def _generate_avatar_glb(
    employee_name: str,
    skin_tone: Optional[Tuple[int, int, int]] = None,
) -> bytes:
    """
    Build a stylized human-like GLB avatar with:
      - Sphere head (skin toned)
      - Cylinder body / torso (accent colored)
      - Two arm cylinders (skin toned)
      - Two eyes (white with dark pupils)
      - Mouth (darker skin tone)
      - Hair/cap (accent colored)

    Low-poly (~1200 triangles total) for fast mobile rendering.
    """
    import trimesh
    import trimesh.creation
    import trimesh.transformations

    skin_rgba = _skin_to_rgba(skin_tone)
    accent_rgba = _name_to_rgba(employee_name)

    # --- Head (skin tone) ---
    head = trimesh.creation.icosphere(subdivisions=2, radius=0.50)
    head.apply_translation([0.0, 1.60, 0.0])
    _colorize(head, skin_rgba)

    # --- Hair / Cap (accent color, hemisphere on top of head) ---
    hair = trimesh.creation.icosphere(subdivisions=2, radius=0.52)
    # Keep only upper half vertices
    verts = hair.vertices.copy()
    # Shift up to head position
    verts[:, 1] += 1.60
    hair = trimesh.Trimesh(vertices=verts, faces=hair.faces, process=True)
    # Remove faces below the equator of the head
    face_centers = hair.vertices[hair.faces].mean(axis=1)
    upper_mask = face_centers[:, 1] > 1.65
    hair = trimesh.Trimesh(
        vertices=hair.vertices,
        faces=hair.faces[upper_mask],
        process=True,
    )
    _colorize(hair, accent_rgba)

    # --- Torso (accent color) ---
    torso = trimesh.creation.cylinder(radius=0.38, height=1.05, sections=14)
    torso.apply_translation([0.0, 0.52, 0.0])
    _colorize(torso, accent_rgba)

    # --- Left arm (skin tone) ---
    arm_l = trimesh.creation.cylinder(radius=0.12, height=0.75, sections=8)
    rot_l = trimesh.transformations.rotation_matrix(0.35, [0, 0, 1])
    arm_l.apply_transform(rot_l)
    arm_l.apply_translation([-0.55, 0.72, 0.0])
    _colorize(arm_l, skin_rgba)

    # --- Right arm (skin tone) ---
    arm_r = trimesh.creation.cylinder(radius=0.12, height=0.75, sections=8)
    rot_r = trimesh.transformations.rotation_matrix(-0.35, [0, 0, 1])
    arm_r.apply_transform(rot_r)
    arm_r.apply_translation([0.55, 0.72, 0.0])
    _colorize(arm_r, skin_rgba)

    # --- Left eye (white) ---
    eye_white = np.array([255, 255, 255, 255], dtype=np.uint8)
    eye_l = trimesh.creation.icosphere(subdivisions=1, radius=0.08)
    eye_l.apply_translation([-0.16, 1.65, 0.44])
    _colorize(eye_l, eye_white)

    # --- Right eye (white) ---
    eye_r = trimesh.creation.icosphere(subdivisions=1, radius=0.08)
    eye_r.apply_translation([0.16, 1.65, 0.44])
    _colorize(eye_r, eye_white)

    # --- Left pupil (dark) ---
    pupil_color = np.array([40, 30, 20, 255], dtype=np.uint8)
    pupil_l = trimesh.creation.icosphere(subdivisions=1, radius=0.04)
    pupil_l.apply_translation([-0.16, 1.65, 0.51])
    _colorize(pupil_l, pupil_color)

    # --- Right pupil (dark) ---
    pupil_r = trimesh.creation.icosphere(subdivisions=1, radius=0.04)
    pupil_r.apply_translation([0.16, 1.65, 0.51])
    _colorize(pupil_r, pupil_color)

    # --- Mouth (slight smile - dark disc) ---
    mouth_rgba = skin_rgba.copy()
    mouth_rgba[:3] = (skin_rgba[:3].astype(np.float32) * 0.45).astype(np.uint8)
    mouth = trimesh.creation.cylinder(radius=0.10, height=0.02, sections=12)
    # Flatten vertically to make it oval/smile-like
    verts = mouth.vertices.copy()
    verts[:, 1] *= 0.4  # Squash vertically
    mouth = trimesh.Trimesh(vertices=verts, faces=mouth.faces, process=True)
    mouth.apply_translation([0.0, 1.48, 0.46])
    _colorize(mouth, mouth_rgba)

    # Assemble scene
    scene = trimesh.Scene()
    scene.add_geometry(head,    node_name="head",    geom_name="head")
    scene.add_geometry(hair,    node_name="hair",    geom_name="hair")
    scene.add_geometry(torso,   node_name="torso",   geom_name="torso")
    scene.add_geometry(arm_l,   node_name="arm_l",   geom_name="arm_l")
    scene.add_geometry(arm_r,   node_name="arm_r",   geom_name="arm_r")
    scene.add_geometry(eye_l,   node_name="eye_l",   geom_name="eye_l")
    scene.add_geometry(eye_r,   node_name="eye_r",   geom_name="eye_r")
    scene.add_geometry(pupil_l, node_name="pupil_l", geom_name="pupil_l")
    scene.add_geometry(pupil_r, node_name="pupil_r", geom_name="pupil_r")
    scene.add_geometry(mouth,   node_name="mouth",   geom_name="mouth")

    glb_bytes = scene.export(file_type="glb")
    return glb_bytes

