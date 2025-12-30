"""
Initialize database and create tables
"""
import os
from dotenv import load_dotenv
from pathlib import Path
from database import Base, engine, Admin, SessionLocal, SchoolLogoPosition
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_database():
    """Create database if it doesn't exist - SQLite auto-creates"""
    print("Using SQLite database - auto-created on first connection")
    return True

def create_tables():
    """Create all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("All tables created successfully")
        return True
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

def seed_admin():
    """Seed the admin user"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == "pramodjadhav1876@gmail.com").first()
        
        if not existing_admin:
            admin_password = "Pramod@1309"
            admin_password_hash = pwd_context.hash(admin_password)
            
            admin = Admin(
                email="pramodjadhav1876@gmail.com",
                password_plain=admin_password,
                password_hash=admin_password_hash
            )
            
            db.add(admin)
            db.commit()
            print("Admin user seeded successfully")
        else:
            print("Admin user already exists")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

def init_database():
    """Main initialization function"""
    print("Starting database initialization...")
    
    if create_database():
        if create_tables():
            seed_admin()
            print("Database initialization completed successfully!")
        else:
            print("Failed to create tables")
    else:
        print("Failed to create database")

if __name__ == "__main__":
    init_database()