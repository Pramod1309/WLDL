from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid
import shutil
from jose import JWTError, jwt

# Import database
from database import (
    get_db, Admin, School, PasswordResetToken, ActivityLog, Resource, 
    Announcement, SupportTicket, ChatMessage, ResourceDownload, 
    KnowledgeArticle, engine, Base
)
from init_db import init_database

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize database on startup
try:
    init_database()
except Exception as e:
    print(f"Database initialization error: {e}")

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "school_logos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create resources upload directory
RESOURCES_UPLOAD_DIR = ROOT_DIR / "uploads" / "resources"
RESOURCES_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")

# Also serve uploads through /api/uploads for proper routing
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="api_uploads")

# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    email: str
    name: Optional[str] = None
    school_id: Optional[str] = None
    logo_path: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    user_type: str  # 'admin' or 'school'

class SchoolCreate(BaseModel):
    school_id: str
    school_name: str
    email: EmailStr
    password: str

class SchoolUpdate(BaseModel):
    school_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class SchoolResponse(BaseModel):
    id: int
    school_id: str
    school_name: str
    email: str
    logo_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ResourceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    class_level: Optional[str] = None
    tags: Optional[str] = None

class ResourceResponse(BaseModel):
    id: int
    resource_id: str
    name: str
    description: Optional[str] = None
    category: str
    file_path: str
    file_type: str
    file_size: int
    class_level: Optional[str] = None
    tags: Optional[str] = None
    uploaded_by_type: str
    uploaded_by_id: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    approval_status: str
    download_count: int
    created_at: datetime
    updated_at: datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = 'normal'
    target_schools: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    priority: str
    target_schools: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

class SupportTicketCreate(BaseModel):
    subject: str
    message: str
    category: str
    priority: str = 'normal'

class SupportTicketResponse(BaseModel):
    id: int
    ticket_id: str
    school_id: str
    school_name: str
    subject: str
    message: str
    category: str
    priority: str
    status: str
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ChatMessageCreate(BaseModel):
    school_id: str
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    school_id: str
    school_name: str
    sender_type: str
    message: str
    is_read: bool
    created_at: datetime

class KnowledgeArticleCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: Optional[str] = None

class KnowledgeArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: Optional[str] = None
    view_count: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Authentication Routes
@api_router.post("/admin/login", response_model=LoginResponse)
async def admin_login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    admin = db.query(Admin).filter(Admin.email == login_data.email).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(
        data={"sub": admin.email, "user_type": "admin"}
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="admin",
        email=admin.email,
        name="Admin"
    )

@api_router.post("/school/login", response_model=LoginResponse)
async def school_login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """School login endpoint"""
    school = db.query(School).filter(School.email == login_data.email).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please contact admin for access."
        )
    
    if not verify_password(login_data.password, school.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Log login activity
    activity = ActivityLog(
        school_id=school.school_id,
        school_name=school.school_name,
        activity_type="login",
        details=f"School logged in successfully"
    )
    db.add(activity)
    db.commit()
    
    access_token = create_access_token(
        data={"sub": school.email, "user_type": "school", "school_id": school.school_id, "school_name": school.school_name, "logo_path": school.logo_path}
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_type="school",
        email=school.email,
        name=school.school_name,
        school_id=school.school_id,
        logo_path=school.logo_path
    )

@api_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Forgot password endpoint - generates reset token"""
    # Check if user exists
    if request.user_type == "admin":
        user = db.query(Admin).filter(Admin.email == request.email).first()
    else:
        user = db.query(School).filter(School.email == request.email).first()
    
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    # Save token to database
    token_record = PasswordResetToken(
        email=request.email,
        token=reset_token,
        user_type=request.user_type,
        expires_at=expires_at
    )
    db.add(token_record)
    db.commit()
    
    # In production, send email here
    # For demo, we just return success message
    return {
        "message": "If the email exists, a password reset link has been sent",
        "demo_token": reset_token  # Only for demo, remove in production
    }

# School Management Routes (Admin only)
@api_router.get("/admin/schools", response_model=List[SchoolResponse])
async def get_schools(db: Session = Depends(get_db)):
    """Get all schools - Admin only"""
    schools = db.query(School).order_by(School.school_id).all()
    return schools

@api_router.post("/admin/schools", response_model=SchoolResponse)
async def create_school(
    school_id: str = Form(...),
    school_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new school with optional logo upload"""
    # Check if school already exists
    existing_school = db.query(School).filter(
        (School.school_id == school_id) | (School.email == email)
    ).first()
    
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School ID or email already exists"
        )
    
    # Handle logo upload
    logo_path = None
    if logo:
        # Create school-specific folder
        school_folder = UPLOAD_DIR / school_id
        school_folder.mkdir(parents=True, exist_ok=True)
        
        # Save logo
        file_extension = logo.filename.split('.')[-1]
        logo_filename = f"logo.{file_extension}"
        logo_file_path = school_folder / logo_filename
        
        with open(logo_file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        
        logo_path = f"/uploads/school_logos/{school_id}/{logo_filename}"
    
    # Create school
    password_hash = get_password_hash(password)
    new_school = School(
        school_id=school_id,
        school_name=school_name,
        email=email,
        password_hash=password_hash,
        logo_path=logo_path
    )
    
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    
    return new_school

@api_router.put("/admin/schools/{school_id}", response_model=SchoolResponse)
async def update_school(
    school_id: str,
    school_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update school information"""
    school = db.query(School).filter(School.school_id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Update fields
    if school_name:
        school.school_name = school_name
    if email:
        # Check if email already used by another school
        existing = db.query(School).filter(
            School.email == email,
            School.id != school.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        school.email = email
    if password:
        school.password_hash = get_password_hash(password)
    
    # Handle logo update
    if logo:
        school_folder = UPLOAD_DIR / school_id
        school_folder.mkdir(parents=True, exist_ok=True)
        
        file_extension = logo.filename.split('.')[-1]
        logo_filename = f"logo.{file_extension}"
        logo_file_path = school_folder / logo_filename
        
        with open(logo_file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        
        school.logo_path = f"/uploads/school_logos/{school_id}/{logo_filename}"
    
    school.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(school)
    
    return school

@api_router.delete("/admin/schools/{school_id}")
async def delete_school(school_id: str, db: Session = Depends(get_db)):
    """Delete a school"""
    school = db.query(School).filter(School.school_id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    # Delete school folder and logo
    school_folder = UPLOAD_DIR / school_id
    if school_folder.exists():
        shutil.rmtree(school_folder)
    
    db.delete(school)
    db.commit()
    
    return {"message": "School deleted successfully"}

@api_router.post("/school/logout")
async def school_logout(school_id: str, school_name: str, db: Session = Depends(get_db)):
    """School logout endpoint - log activity"""
    activity = ActivityLog(
        school_id=school_id,
        school_name=school_name,
        activity_type="logout",
        details=f"School logged out"
    )
    db.add(activity)
    db.commit()
    return {"message": "Logged out successfully"}

@api_router.post("/school/activity")
async def log_school_activity(
    school_id: str,
    school_name: str,
    activity_type: str,
    details: str = None,
    db: Session = Depends(get_db)
):
    """Log school activity"""
    activity = ActivityLog(
        school_id=school_id,
        school_name=school_name,
        activity_type=activity_type,
        details=details
    )
    db.add(activity)
    db.commit()
    return {"message": "Activity logged"}

@api_router.get("/admin/activities")
async def get_all_activities(db: Session = Depends(get_db)):
    """Get all school activities - Admin only"""
    activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(200).all()
    return [{
        "id": activity.id,
        "school_id": activity.school_id,
        "school_name": activity.school_name,
        "activity_type": activity.activity_type,
        "timestamp": activity.timestamp.isoformat(),
        "details": activity.details
    } for activity in activities]

# ==================== RESOURCE MANAGEMENT ROUTES ====================

@api_router.post("/admin/resources/upload", response_model=ResourceResponse)
async def upload_resource(
    name: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    class_level: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Admin upload resource"""
    # Validate file size (100MB limit)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes
    
    # Read file to check size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 100MB limit. Your file is {file_size / (1024*1024):.2f}MB"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Generate unique resource ID
    resource_id = str(uuid.uuid4())
    
    # Create category folder
    category_folder = RESOURCES_UPLOAD_DIR / category
    category_folder.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_extension = file.filename.split('.')[-1]
    safe_filename = f"{resource_id}.{file_extension}"
    file_path_on_disk = category_folder / safe_filename
    
    with open(file_path_on_disk, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_path = f"/uploads/resources/{category}/{safe_filename}"
    
    # Create resource record
    new_resource = Resource(
        resource_id=resource_id,
        name=name,
        description=description,
        category=category,
        file_path=file_path,
        file_type=file.content_type or f"application/{file_extension}",
        file_size=file_size,
        class_level=class_level,
        tags=tags,
        uploaded_by_type='admin',
        approval_status='approved'
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    return new_resource

@api_router.get("/admin/resources", response_model=List[ResourceResponse])
async def get_all_resources(
    category: Optional[str] = None,
    approval_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all resources - Admin only"""
    query = db.query(Resource)
    
    if category:
        query = query.filter(Resource.category == category)
    
    if approval_status:
        query = query.filter(Resource.approval_status == approval_status)
    
    resources = query.order_by(Resource.created_at.desc()).all()
    return resources

@api_router.put("/admin/resources/{resource_id}/approve")
async def approve_resource(resource_id: str, db: Session = Depends(get_db)):
    """Approve a school-uploaded resource"""
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.approval_status = 'approved'
    resource.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Resource approved successfully"}

@api_router.put("/admin/resources/{resource_id}/reject")
async def reject_resource(resource_id: str, db: Session = Depends(get_db)):
    """Reject a school-uploaded resource"""
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.approval_status = 'rejected'
    resource.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Resource rejected"}

@api_router.delete("/admin/resources/{resource_id}")
async def delete_resource(resource_id: str, db: Session = Depends(get_db)):
    """Delete a resource - Admin only"""
    resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Delete file from disk
    file_path = ROOT_DIR / resource.file_path.lstrip('/')
    if file_path.exists():
        file_path.unlink()
    
    db.delete(resource)
    db.commit()
    
    return {"message": "Resource deleted successfully"}

# School Resource Routes
@api_router.get("/school/resources", response_model=List[ResourceResponse])
async def get_school_resources(
    category: Optional[str] = None,
    school_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get resources visible to schools (approved admin resources + own uploads)"""
    query = db.query(Resource).filter(
        (Resource.uploaded_by_type == 'admin') | 
        (Resource.uploaded_by_id == school_id)
    )
    
    if category:
        query = query.filter(Resource.category == category)
    
    # Only show approved resources or school's own pending uploads
    query = query.filter(
        (Resource.approval_status == 'approved') |
        ((Resource.uploaded_by_id == school_id) & (Resource.uploaded_by_type == 'school'))
    )
    
    resources = query.order_by(Resource.created_at.desc()).all()
    return resources

@api_router.post("/school/resources/upload", response_model=ResourceResponse)
async def school_upload_resource(
    name: str = Form(...),
    category: str = Form(...),
    school_id: str = Form(...),
    school_name: str = Form(...),
    description: Optional[str] = Form(None),
    class_level: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """School upload resource (requires admin approval)"""
    # Validate file size (100MB limit)
    MAX_FILE_SIZE = 100 * 1024 * 1024
    
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 100MB limit"
        )
    
    await file.seek(0)
    
    resource_id = str(uuid.uuid4())
    
    # Create category folder
    category_folder = RESOURCES_UPLOAD_DIR / category / "school_uploads" / school_id
    category_folder.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_extension = file.filename.split('.')[-1]
    safe_filename = f"{resource_id}.{file_extension}"
    file_path_on_disk = category_folder / safe_filename
    
    with open(file_path_on_disk, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_path = f"/uploads/resources/{category}/school_uploads/{school_id}/{safe_filename}"
    
    # Create resource record (pending approval)
    new_resource = Resource(
        resource_id=resource_id,
        name=name,
        description=description,
        category=category,
        file_path=file_path,
        file_type=file.content_type or f"application/{file_extension}",
        file_size=file_size,
        class_level=class_level,
        tags=tags,
        uploaded_by_type='school',
        uploaded_by_id=school_id,
        uploaded_by_name=school_name,
        approval_status='pending'
    )
    
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    return new_resource

@api_router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: str,
    school_id: str = None,
    school_name: str = None,
    db: Session = Depends(get_db)
):
    """Download a resource file"""
    try:
        print(f"Download requested for resource_id: {resource_id}")
        print(f"School info: {school_id}, {school_name}")
        
        # Get the resource from the database
        resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
        if not resource:
            print(f"Resource not found in database: {resource_id}")
            raise HTTPException(status_code=404, detail="Resource not found")
        
        print(f"Resource found: {resource.name}, file_path: {resource.file_path}")
        
        # Get the file path - FIXED: Handle different path formats
        file_path = resource.file_path
        
        # Remove leading slash if present
        if file_path.startswith('/'):
            file_path = file_path[1:]
        
        full_file_path = os.path.join(ROOT_DIR, file_path)
        print(f"Looking for file at: {full_file_path}")
        
        if not os.path.exists(full_file_path):
            # Try alternative path structure - if path starts with uploads/
            if file_path.startswith('uploads/'):
                alt_path = file_path
            else:
                alt_path = os.path.join("uploads", file_path)
            
            full_file_path = os.path.join(ROOT_DIR, alt_path)
            print(f"Trying alternative path: {full_file_path}")
            
            if not os.path.exists(full_file_path):
                # Last attempt: check if file exists in resources directory
                filename = os.path.basename(file_path)
                resource_dir = os.path.join(ROOT_DIR, "uploads", "resources", resource.category)
                full_file_path = os.path.join(resource_dir, filename)
                print(f"Trying resources directory: {full_file_path}")
                
                if not os.path.exists(full_file_path):
                    print(f"File not found at any location for resource: {resource_id}")
                    print(f"File path in DB: {resource.file_path}")
                    raise HTTPException(status_code=404, detail="File not found on server")
        
        print(f"File found at: {full_file_path}, size: {os.path.getsize(full_file_path)} bytes")
        
        # Log download if school info is provided
        if school_id and school_name:
            download_log = ResourceDownload(
                resource_id=resource_id,
                school_id=school_id,
                school_name=school_name
            )
            db.add(download_log)
            
            # Increment download count
            resource.download_count += 1
            db.commit()
        
        # Determine file extension for download
        file_extension = resource.file_type.split('/')[-1] if resource.file_type else ''
        download_filename = f"{resource.name}"
        if file_extension and not download_filename.endswith(f".{file_extension}"):
            download_filename = f"{download_filename}.{file_extension}"
        
        # Return the file for download
        return FileResponse(
            path=full_file_path,
            filename=download_filename,
            media_type=resource.file_type or 'application/octet-stream',
            headers={
                "Content-Disposition": f"attachment; filename=\"{download_filename}\"",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
        
    except HTTPException as he:
        print(f"HTTP Exception in download: {he.detail}")
        raise he
    except Exception as e:
        db.rollback()
        print(f"Download error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/resources/{resource_id}/preview")
async def preview_resource(
    resource_id: str,
    db: Session = Depends(get_db)
):
    """Preview a resource file (supports all file types)"""
    try:
        print(f"Preview requested for resource_id: {resource_id}")
        
        # Get the resource from the database
        resource = db.query(Resource).filter(Resource.resource_id == resource_id).first()
        if not resource:
            raise HTTPException(status_code=404, detail="Resource not found")
        
        print(f"Resource found: {resource.name}, file_path: {resource.file_path}, file_type: {resource.file_type}")
        
        # Get the file path - FIXED: Handle different path formats
        file_path = resource.file_path
        
        # Remove leading slash if present
        if file_path.startswith('/'):
            file_path = file_path[1:]
        
        full_file_path = os.path.join(ROOT_DIR, file_path)
        print(f"Looking for file at: {full_file_path}")
        
        if not os.path.exists(full_file_path):
            # Try alternative path structure
            if file_path.startswith('uploads/'):
                alt_path = file_path
            else:
                alt_path = os.path.join("uploads", file_path)
            
            full_file_path = os.path.join(ROOT_DIR, alt_path)
            print(f"Trying alternative path: {full_file_path}")
            
            if not os.path.exists(full_file_path):
                # Last attempt: check if file exists in resources directory
                filename = os.path.basename(file_path)
                resource_dir = os.path.join(ROOT_DIR, "uploads", "resources", resource.category)
                full_file_path = os.path.join(resource_dir, filename)
                print(f"Trying resources directory: {full_file_path}")
                
                if not os.path.exists(full_file_path):
                    raise HTTPException(status_code=404, detail="File not found on server")
        
        print(f"File found for preview: {full_file_path}")
        
        # Determine the correct media type
        file_type = resource.file_type
        if not file_type or file_type == 'application/octet-stream':
            # Try to infer from file extension
            import mimetypes
            file_type = mimetypes.guess_type(full_file_path)[0] or 'application/octet-stream'
            print(f"Inferred file type: {file_type}")
        
        # Return the file for inline preview with proper headers
        # Using "inline" disposition allows browser to display the file
        return FileResponse(
            path=full_file_path,
            filename=resource.name,
            media_type=file_type,
            headers={
                "Content-Disposition": f"inline; filename=\"{resource.name}\"",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Preview error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Debug endpoint to check file structure
@api_router.get("/debug/files")
async def debug_files():
    """Debug endpoint to list all uploaded files"""
    import glob
    files = []
    for file_path in glob.glob(str(RESOURCES_UPLOAD_DIR) + "/**/*", recursive=True):
        if os.path.isfile(file_path):
            relative_path = os.path.relpath(file_path, ROOT_DIR)
            files.append({
                "path": relative_path,
                "size": os.path.getsize(file_path),
                "exists": os.path.exists(file_path)
            })
    return {"files": files}

# ==================== ANNOUNCEMENT ROUTES ====================

@api_router.post("/admin/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, db: Session = Depends(get_db)):
    """Create announcement - Admin only"""
    new_announcement = Announcement(
        title=announcement.title,
        content=announcement.content,
        priority=announcement.priority,
        target_schools=announcement.target_schools
    )
    
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    
    return new_announcement

@api_router.get("/admin/announcements", response_model=List[AnnouncementResponse])
async def get_admin_announcements(db: Session = Depends(get_db)):
    """Get all announcements - Admin"""
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return announcements

@api_router.put("/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: int,
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db)
):
    """Update announcement - Admin only"""
    existing = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    existing.title = announcement.title
    existing.content = announcement.content
    existing.priority = announcement.priority
    existing.target_schools = announcement.target_schools
    existing.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(existing)
    
    return existing

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    """Delete announcement - Admin only"""
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    
    return {"message": "Announcement deleted"}

@api_router.get("/school/announcements", response_model=List[AnnouncementResponse])
async def get_school_announcements(school_id: str, db: Session = Depends(get_db)):
    """Get announcements for school"""
    announcements = db.query(Announcement).filter(
        Announcement.is_active == True,
        (Announcement.target_schools == None) | 
        (Announcement.target_schools.like(f"%{school_id}%"))
    ).order_by(Announcement.created_at.desc()).all()
    
    return announcements

# ==================== SUPPORT TICKET ROUTES ====================

@api_router.post("/school/support/tickets", response_model=SupportTicketResponse)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    school_id: str,
    school_name: str,
    db: Session = Depends(get_db)
):
    """Create support ticket - School"""
    ticket_id = f"TICKET-{uuid.uuid4().hex[:8].upper()}"
    
    new_ticket = SupportTicket(
        ticket_id=ticket_id,
        school_id=school_id,
        school_name=school_name,
        subject=ticket.subject,
        message=ticket.message,
        category=ticket.category,
        priority=ticket.priority
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return new_ticket

@api_router.get("/school/support/tickets", response_model=List[SupportTicketResponse])
async def get_school_tickets(school_id: str, db: Session = Depends(get_db)):
    """Get tickets for school"""
    tickets = db.query(SupportTicket).filter(
        SupportTicket.school_id == school_id
    ).order_by(SupportTicket.created_at.desc()).all()
    
    return tickets

@api_router.get("/admin/support/tickets", response_model=List[SupportTicketResponse])
async def get_all_tickets(db: Session = Depends(get_db)):
    """Get all support tickets - Admin"""
    tickets = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).all()
    return tickets

@api_router.put("/admin/support/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    status: Optional[str] = Form(None),
    admin_response: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Update support ticket - Admin"""
    ticket = db.query(SupportTicket).filter(SupportTicket.ticket_id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if status:
        ticket.status = status
        if status == 'resolved':
            ticket.resolved_at = datetime.utcnow()
    
    if admin_response:
        ticket.admin_response = admin_response
    
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    
    return ticket

# ==================== CHAT ROUTES ====================

@api_router.post("/chat/send", response_model=ChatMessageResponse)
async def send_chat_message(
    school_id: str = Form(...),
    school_name: str = Form(...),
    sender_type: str = Form(...),
    message: str = Form(...),
    db: Session = Depends(get_db)
):
    """Send chat message"""
    new_message = ChatMessage(
        school_id=school_id,
        school_name=school_name,
        sender_type=sender_type,
        message=message
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message

@api_router.get("/chat/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(school_id: str, db: Session = Depends(get_db)):
    """Get chat messages for a school"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.school_id == school_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return messages

@api_router.put("/chat/mark-read/{school_id}")
async def mark_messages_read(school_id: str, sender_type: str, db: Session = Depends(get_db)):
    """Mark messages as read"""
    # Mark all messages from opposite sender as read
    opposite_sender = 'school' if sender_type == 'admin' else 'admin'
    
    db.query(ChatMessage).filter(
        ChatMessage.school_id == school_id,
        ChatMessage.sender_type == opposite_sender,
        ChatMessage.is_read == False
    ).update({ChatMessage.is_read: True})
    
    db.commit()
    
    return {"message": "Messages marked as read"}

# ==================== KNOWLEDGE BASE ROUTES ====================

@api_router.post("/admin/knowledge-base", response_model=KnowledgeArticleResponse)
async def create_article(article: KnowledgeArticleCreate, db: Session = Depends(get_db)):
    """Create knowledge base article - Admin"""
    new_article = KnowledgeArticle(
        title=article.title,
        content=article.content,
        category=article.category,
        tags=article.tags
    )
    
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    
    return new_article

@api_router.get("/knowledge-base", response_model=List[KnowledgeArticleResponse])
async def get_articles(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Get knowledge base articles"""
    query = db.query(KnowledgeArticle).filter(KnowledgeArticle.is_published == True)
    
    if category:
        query = query.filter(KnowledgeArticle.category == category)
    
    articles = query.order_by(KnowledgeArticle.created_at.desc()).all()
    return articles

@api_router.get("/knowledge-base/{article_id}", response_model=KnowledgeArticleResponse)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get single article and increment view count"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    article.view_count += 1
    db.commit()
    db.refresh(article)
    
    return article

@api_router.delete("/admin/knowledge-base/{article_id}")
async def delete_article(article_id: int, db: Session = Depends(get_db)):
    """Delete article - Admin"""
    article = db.query(KnowledgeArticle).filter(KnowledgeArticle.id == article_id).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    
    return {"message": "Article deleted"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/admin/analytics/resources")
async def get_resource_analytics(db: Session = Depends(get_db)):
    """Get resource analytics - Admin"""
    total_resources = db.query(Resource).count()
    pending_approvals = db.query(Resource).filter(Resource.approval_status == 'pending').count()
    total_downloads = db.query(ResourceDownload).count()
    
    # Top downloaded resources
    from sqlalchemy import func
    top_resources = db.query(
        Resource.name,
        Resource.category,
        Resource.download_count
    ).order_by(Resource.download_count.desc()).limit(10).all()
    
    return {
        "total_resources": total_resources,
        "pending_approvals": pending_approvals,
        "total_downloads": total_downloads,
        "top_resources": [
            {"name": r.name, "category": r.category, "downloads": r.download_count}
            for r in top_resources
        ]
    }

@api_router.get("/school/analytics/usage")
async def get_school_usage(school_id: str, db: Session = Depends(get_db)):
    """Get usage statistics for school"""
    # Downloads this month
    from datetime import datetime, timedelta
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    downloads_this_month = db.query(ResourceDownload).filter(
        ResourceDownload.school_id == school_id,
        ResourceDownload.downloaded_at >= start_of_month
    ).count()
    
    # Total uploads by school
    uploads_by_school = db.query(Resource).filter(
        Resource.uploaded_by_id == school_id
    ).count()
    
    # Storage used
    from sqlalchemy import func
    storage_used = db.query(func.sum(Resource.file_size)).filter(
        Resource.uploaded_by_id == school_id
    ).scalar() or 0
    
    return {
        "downloads_this_month": downloads_this_month,
        "resources_uploaded": uploads_by_school,
        "storage_used_bytes": storage_used,
        "storage_used_mb": round(storage_used / (1024 * 1024), 2)
    }

@api_router.get("/")
async def root():
    return {"message": "Wonder Learning Digital Library API"}

# Include the router in the main app
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Add CORS headers to all responses
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Serve static files from the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)