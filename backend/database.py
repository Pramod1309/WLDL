from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import UniqueConstraint

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database Configuration - Using SQLite for now (can switch to MySQL later)
DB_PATH = ROOT_DIR / "wonder_learning.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create engine
engine = create_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Admin Model
class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_plain = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# School Model
class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(String(100), unique=True, index=True, nullable=False)
    school_name = Column(String(255), nullable=False)
    logo_path = Column(String(500), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Password Reset Tokens Model
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    user_type = Column(String(50), nullable=False)  # 'admin' or 'school'
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Integer, default=0)  # 0 = not used, 1 = used

# Activity Log Model
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(String(100), index=True, nullable=False)
    school_name = Column(String(255), nullable=False)
    activity_type = Column(String(50), nullable=False)  # 'login', 'logout', 'dashboard_access'
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    details = Column(Text, nullable=True)

# Resource Model
class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)  # 'academic', 'marketing', etc.
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=False)  # 'pdf', 'doc', 'video', etc.
    file_size = Column(Integer, nullable=False)  # Size in bytes
    class_level = Column(String(100), nullable=True)  # 'Nursery', 'LKG', 'UKG', etc.
    tags = Column(Text, nullable=True)  # Comma-separated tags
    uploaded_by_type = Column(String(50), nullable=False)  # 'admin' or 'school'
    uploaded_by_id = Column(String(100), nullable=True)  # school_id if uploaded by school
    uploaded_by_name = Column(String(255), nullable=True)  # school name if uploaded by school
    approval_status = Column(String(50), default='approved')  # 'pending', 'approved', 'rejected'
    download_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Announcement Model
class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(50), default='normal')  # 'low', 'normal', 'high', 'urgent'
    target_schools = Column(Text, nullable=True)  # Comma-separated school_ids, null = all schools
    is_active = Column(Boolean, default=True)
    created_by = Column(String(100), default='admin')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Support Ticket Model
class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(100), unique=True, nullable=False)
    school_id = Column(String(100), nullable=False, index=True)
    school_name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # 'technical', 'resource', 'general', etc.
    priority = Column(String(50), default='normal')  # 'low', 'normal', 'high'
    status = Column(String(50), default='open')  # 'open', 'in_progress', 'resolved', 'closed'
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

# Chat Message Model
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(String(100), nullable=False, index=True)
    school_name = Column(String(255), nullable=False)
    sender_type = Column(String(50), nullable=False)  # 'admin' or 'school'
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Resource Download Log Model
class ResourceDownload(Base):
    __tablename__ = "resource_downloads"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String(100), nullable=False, index=True)
    school_id = Column(String(100), nullable=False, index=True)
    school_name = Column(String(255), nullable=False)
    downloaded_at = Column(DateTime, default=datetime.utcnow)

# Knowledge Base Article Model
class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    tags = Column(Text, nullable=True)
    view_count = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
# School Logo Position Model
class SchoolLogoPosition(Base):
    __tablename__ = "school_logo_positions"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(100), nullable=False, index=True)
    x_position = Column(Integer, default=50)  # Percentage from left
    y_position = Column(Integer, default=10)  # Percentage from top
    width = Column(Integer, default=20)  # Width percentage
    opacity = Column(Float, default=0.7)  # Opacity level
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('school_id', 'resource_id', name='unique_school_resource_logo'),
    )

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
