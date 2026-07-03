FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV and other ML tools
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory into /app/backend
COPY backend/ ./backend/

# Set working directory to the backend folder for execution
WORKDIR /app/backend

# Run the FastAPI app respecting Railway's PORT environment variable
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
