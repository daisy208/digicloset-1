# DigiCloset Backend Service

The backend service acts as the core orchestration layer for DigiCloset, managing dataflows between Shopify, the PostgreSQL database, and the AI model service. It is built using FastAPI for high performance and ease of use.

## Architecture

- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (via SQLAlchemy & Alembic)
- **Object Storage**: MinIO (S3-compatible)
- **Asynchronous Tasks**: Integrated support for background processing

## Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL
- MinIO (or AWS S3)

### Local Development

1. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Docker
The backend is containerized. To build it using the Dockerfile in this directory:
```bash
docker build -t digicloset-backend .
```
Refer to the root `README.md` for Docker Compose instructions.

## API Documentation
Once running, interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
