# NOTE: This router implements B2C upload/image flows.
# DigiCloset B2B pivot: These endpoints are deprioritized and will be removed in a future release.
# Do not delete yet. See REFRACTOR_PLAN.md for details.
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import aiofiles, os, uuid
from ..core import settings

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/digicloset_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post('/', response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    if file.content_type.split('/')[0] != 'image':
        raise HTTPException(status_code=400, detail='Only image uploads allowed')
    ext = os.path.splitext(file.filename)[1]
    dest_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, dest_name)
    size = 0
    async with aiofiles.open(dest_path, 'wb') as out:
        while content := await file.read(1024*1024):
            size += len(content)
            if size > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail='File too large (max 10MB)')
            await out.write(content)
    # In production: upload to S3/MinIO and persist metadata to DB
    return {"id": dest_name, "path": dest_path, "size": size}
