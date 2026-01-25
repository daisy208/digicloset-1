from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, uploads, infer, widget

app = FastAPI(title="DigiCloset Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# B2C endpoints (deprioritized)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["uploads"])

# B2B endpoints (Shopify-first)
app.include_router(widget.router, prefix="/api/v1", tags=["widget"])
app.include_router(infer.router, prefix="/api/v1/infer", tags=["infer"])

@app.get("/")
async def root():
    return {"message": "DigiCloset backend - upgrade pack placeholder"}
