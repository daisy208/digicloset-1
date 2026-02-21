from fastapi import APIRouter, BackgroundTasks

from app.workers.ai_jobs import bulk_reanalyze

router = APIRouter(prefix="/ai/bulk", tags=["AI Bulk"])


@router.post("/reanalyze")
def bulk_reanalyze_products(
    products: list,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(bulk_reanalyze, products)
    return {"status": "started", "count": len(products)}
