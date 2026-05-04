"""
routes/scan.py
POST /api/scan/image  — full pipeline:
  1. Receive image
  2. Try barcode detection
  3. If no barcode → OCR for product name
  4. Lookup OpenFoodFacts (cache-first)
  5. Run verdict engine against user profile
  6. Save to scan_history
  7. Return structured result

POST /api/scan/barcode  — barcode string only (no image needed)
"""

import json
import logging
from flask import Blueprint, request, jsonify
from database import db
from services.barcode import detect_barcode
from services.ocr import extract_text
from services.openfoodfacts import get_by_barcode, search_by_name
from services.verdict import compute_verdict

logger = logging.getLogger(__name__)
scan_bp = Blueprint("scan", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "bmp"}


# ──────────────────────────────────────────────────────────────
# POST /api/scan/image
# ──────────────────────────────────────────────────────────────
@scan_bp.post("/image")
def scan_image():
    """
    Multipart form:
      image   — image file (required)
      user_id — integer (optional; if present, verdict is personalised)
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    image_bytes = file.read()
    user_id     = request.form.get("user_id", type=int)

    # ── Step 1: Try barcode detection ────────────────────────────────────────
    barcode = detect_barcode(image_bytes)
    scan_method = "barcode"
    product = None

    if barcode:
        logger.info("[Scan] barcode detected: %s", barcode)
        product = get_by_barcode(barcode)

    # ── Step 2: Fallback to OCR ───────────────────────────────────────────────
    if not product:
        scan_method = "ocr"
        ocr_result  = extract_text(image_bytes)
        product_name = ocr_result.get("product_name", "").strip()
        logger.info("[Scan] OCR name: '%s'", product_name)

        if not product_name:
            return jsonify({
                "error":   "Could not detect barcode or read product name from image",
                "ocr_raw": ocr_result.get("full_text", "")[:500],
            }), 422

        results = search_by_name(product_name, limit=1)
        if results:
            product = results[0]
            barcode = product.get("barcode")
        else:
            # Return partial OCR data so the frontend can still show something
            return jsonify({
                "scan_method":   "ocr",
                "product_name":  product_name,
                "ocr_result":    ocr_result,
                "product":       None,
                "verdict":       None,
                "message":       "Product not found in database — showing OCR data only",
            }), 200

    # ── Step 3: Verdict ───────────────────────────────────────────────────────
    profile  = _get_profile(user_id)
    verdict_data = compute_verdict(product, profile)

    # ── Step 4: Persist to history ────────────────────────────────────────────
    history_id = _save_history(
        user_id     = user_id,
        barcode     = barcode or product.get("barcode"),
        product_name= product.get("name", ""),
        scan_method = scan_method,
        verdict_data= verdict_data,
    )

    return jsonify({
        "scan_id":     history_id,
        "scan_method": scan_method,
        "barcode":     barcode,
        "product":     product,
        "verdict":     verdict_data,
    }), 200


# ──────────────────────────────────────────────────────────────
# POST /api/scan/barcode
# ──────────────────────────────────────────────────────────────
@scan_bp.post("/barcode")
def scan_barcode():
    """
    JSON body: { "barcode": "...", "user_id": 1 }
    """
    body    = request.get_json(force=True, silent=True) or {}
    barcode = (body.get("barcode") or "").strip()
    user_id = body.get("user_id")

    if not barcode:
        return jsonify({"error": "barcode is required"}), 400

    product = get_by_barcode(barcode)
    if not product:
        return jsonify({"error": f"Product not found for barcode {barcode}"}), 404

    profile      = _get_profile(user_id)
    verdict_data = compute_verdict(product, profile)
    history_id   = _save_history(
        user_id     = user_id,
        barcode     = barcode,
        product_name= product.get("name", ""),
        scan_method = "barcode",
        verdict_data= verdict_data,
    )

    return jsonify({
        "scan_id":     history_id,
        "scan_method": "barcode",
        "barcode":     barcode,
        "product":     product,
        "verdict":     verdict_data,
    }), 200


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def _allowed(filename: str | None) -> bool:
    if not filename:
        return False
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _get_profile(user_id: int | None) -> dict:
    if not user_id:
        return {}
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)
        ).fetchone()
    return dict(row) if row else {}


def _save_history(*, user_id, barcode, product_name, scan_method, verdict_data) -> int | None:
    if not user_id:
        return None
    with db() as conn:
        cur = conn.execute(
            """INSERT INTO scan_history
               (user_id, barcode, product_name, scan_method, verdict, verdict_reason, allergen_hits)
               VALUES (?,?,?,?,?,?,?)""",
            (
                user_id,
                barcode,
                product_name,
                scan_method,
                verdict_data.get("verdict"),
                verdict_data.get("reason"),
                json.dumps(verdict_data.get("allergen_hits", [])),
            ),
        )
    return cur.lastrowid
