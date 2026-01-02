# Use a multi-stage build for smaller image size
FROM node:18 as frontend-builder

# Set working directory
WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./frontend/

# Install frontend dependencies with legacy peer deps
RUN cd frontend && npm install --legacy-peer-deps

# Copy frontend source
COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Final stage
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy backend requirements
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend /app/backend

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# Create necessary directories
RUN mkdir -p /app/backend/uploads

# Expose port
EXPOSE 8000

# Start command
CMD ["sh", "-c", "python init_db.py && python server.py"]