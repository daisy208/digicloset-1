## Multi-stage Dockerfile for production-ready FastAPI app
FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS builder
COPY pyproject.toml requirements.txt /app/
RUN python -m pip install --upgrade pip
RUN pip wheel --wheel-dir /app/wheels -r requirements.txt

FROM base AS runtime
COPY --from=builder /app/wheels /wheels
RUN pip install --no-index --find-links=/wheels -r requirements.txt
COPY . /app

ENV PORT=8000
EXPOSE ${PORT}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
