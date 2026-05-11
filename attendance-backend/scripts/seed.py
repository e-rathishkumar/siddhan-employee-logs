"""Seed script to create initial admin user and roles."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal, engine, Base
from app.models import Role, User, Employee, Geofence, FacePhoto, KioskLog
from app.models.log import CheckLog
from app.core.security import hash_password
from app.core.config import get_settings

settings = get_settings()


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Migrate: add face_encoding column if it doesn't exist
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "face_photos" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("face_photos")]
        if "face_encoding" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE face_photos ADD COLUMN face_encoding TEXT"))
            print("  Migrated: added face_encoding column to face_photos")
        if "angle_label" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE face_photos ADD COLUMN angle_label VARCHAR(50) DEFAULT 'front'"))
            print("  Migrated: added angle_label column to face_photos")
        if "capture_date" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE face_photos ADD COLUMN capture_date VARCHAR(10)"))
            print("  Migrated: added capture_date column to face_photos")
        if "day_slot" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE face_photos ADD COLUMN day_slot INTEGER DEFAULT 0 NOT NULL"))
            print("  Migrated: added day_slot column to face_photos")

    # Migrate: add is_new_user column if it doesn't exist
    if "users" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "is_new_user" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_new_user BOOLEAN DEFAULT 1 NOT NULL"))
            print("  Migrated: added is_new_user column to users")
            with engine.begin() as conn:
                conn.execute(text("UPDATE users SET is_new_user = 0 WHERE id IN (SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'admin')"))
            print("  Set admin users as not new")

    db = SessionLocal()
    try:
        # Create roles
        roles_data = [
            {"name": "admin", "description": "System Administrator", "permissions": ["*"]},
            {"name": "manager", "description": "Department Manager", "permissions": ["employees.read", "logs.read"]},
            {"name": "hr", "description": "Human Resources", "permissions": ["employees.*", "logs.*"]},
            {"name": "employee", "description": "Regular Employee", "permissions": ["logs.self"]},
        ]

        for role_data in roles_data:
            existing = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing:
                db.add(Role(**role_data))
                print(f"  Created role: {role_data['name']}")

        db.commit()

        # Create admin user
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        existing_admin = db.query(User).filter(User.email == settings.default_admin_email).first()
        if not existing_admin:
            admin_user = User(
                email=settings.default_admin_email,
                name="System Admin",
                hashed_password=hash_password(settings.default_admin_password),
                role_id=admin_role.id,
                is_new_user=False,
            )
            db.add(admin_user)
            db.commit()
            print(f"  Created admin user: {settings.default_admin_email}")
        else:
            print(f"  Admin user already exists: {settings.default_admin_email}")

        print("Seed completed successfully.")

    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting database seed...")
    seed()
    print("Done.")
