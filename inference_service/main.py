from fastapi import FastAPI

app = FastAPI(title="Inference Service Compatibility", version="1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}

