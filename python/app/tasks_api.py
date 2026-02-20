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
from fastapi import APIRouter, Request, HTTPException
import requests
import hmac
import hashlib
from urllib.parse import urlencode
from app.core import SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, SHOPIFY_REDIRECT_URI

router = APIRouter()

@router.get("/shopify/install")
def shopify_install(shop: str):
    params = {
        "client_id": SHOPIFY_API_KEY,
        "scope": SHOPIFY_SCOPES,
        "redirect_uri": SHOPIFY_REDIRECT_URI,
    }
    return {
        "install_url": f"https://{shop}/admin/oauth/authorize?{urlencode(params)}"
    }

@router.get("/shopify/callback")
def shopify_callback(request: Request):
    query_params = dict(request.query_params)

    received_hmac = query_params.pop("hmac")
    sorted_params = urlencode(sorted(query_params.items()))
    digest = hmac.new(
        SHOPIFY_API_SECRET.encode(),
        sorted_params.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(digest, received_hmac):
        raise HTTPException(status_code=400, detail="Invalid HMAC")

    shop = query_params["shop"]
    code = query_params["code"]

    token_res = requests.post(
        f"https://{shop}/admin/oauth/access_token",
        json={
            "client_id": SHOPIFY_API_KEY,
            "client_secret": SHOPIFY_API_SECRET,
            "code": code,
        }
    )

    access_token = token_res.json()["access_token"]

    # Save shop + token to DB here

    return {"status": "installed"}
@router.post("/shopify/webhook/app-uninstalled")
async def app_uninstalled(request: Request):
    shop = request.headers.get("x-shopify-shop-domain")

    # delete shop from DB
    # delete related data

    return {"status": "deleted"}
    @router.post("/shopify/create-subscription")
def create_subscription(shop: str):

    mutation = """
    mutation {
      appSubscriptionCreate(
        name: "Pro Plan"
        returnUrl: "https://yourapp.com/confirm"
        test: true
        lineItems: [{
          plan: {
            appRecurringPricingDetails: {
              price: { amount: 19.0, currencyCode: USD }
              interval: EVERY_30_DAYS
            }
          }
        }]
      ) {
        confirmationUrl
      }
    }
    """

    # send GraphQL request using stored shop token
