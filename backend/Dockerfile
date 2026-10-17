FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Production Image
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies including OCR engine and curl for health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Copy application source code
COPY . /app/backend

# Create uploads storage directory
RUN mkdir -p /app/data/uploads

# Expose dynamic Cloud Run / Container port
EXPOSE 8000

# Run FastAPI with uvicorn respecting Cloud Run PORT injection
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
