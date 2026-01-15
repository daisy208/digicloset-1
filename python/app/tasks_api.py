from flask import Blueprint, request, jsonify
from tasks import run_tryon
import uuid

bp = Blueprint('tasks', __name__)

@bp.route("/api/tryon", methods=["POST"])
def create_tryon():
    """
    Accepts basic payload with image path (or base64), clothing metadata, and options.
    Enqueues Celery task and returns task id immediately (202).
    """
    payload = request.json or {}
    # validate payload here
    input_image_path = payload.get("image_path")
    clothing = payload.get("clothing", {})
    options = payload.get("options", {})
  
    task = run_tryon.apply_async(args=[input_image_path, clothing, options])
    return jsonify({"task_id": task.id}), 202

@bp.route("/api/tryon/status/<task_id>", methods=["GET"])
def tryon_status(task_id):
    from celery.result import AsyncResult
    res = AsyncResult(task_id)
    if res.state == "PENDING":
        return jsonify({"status": "pending"}), 200
    elif res.state == "STARTED":
        return jsonify({"status": "started"}), 200
    elif res.state == "SUCCESS":
        return jsonify({"status": "success", "result": res.result}), 200
    elif res.state == "FAILURE":
        return jsonify({"status": "failure", "error": str(res.result)}), 500
    else:
        return jsonify({"status": res.state}), 200
