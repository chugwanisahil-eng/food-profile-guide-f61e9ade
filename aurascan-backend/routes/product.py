"""
routes/product.py
GET  /api/product/<barcode>        — fetch single product (cache-first)
GET  /api/product/search?q=&limit= — search by name
GET  /api/product/cache/stats      — cache statistics
DELETE /api/product/cache/<barcode>— bust a single cache entry
"""

import logging
from flask import Blueprint, request, jsonify
from database import db
from services.openfoodfacts import get_by_barcode, search_by_name

logger = logging.getLogger(__name__)
product_bp = Blueprint("product", __name__)


@product_bp.get("/<barcode>")
def get_product(barcode: str):
    product = get_by_barcode(barcode.strip())
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product}), 200


@product_bp.get("/search")
def search_products():
    q     = (request.args.get("q") or "").strip()
    limit = request.args.get("limit", 5, type=int)
    if not q:
        return jsonify({"error": "q parameter required"}), 400
    results = search_by_name(q, limit=min(limit, 20))
    return jsonify({"results": results, "count": len(results)}), 200


@product_bp.get("/cache/stats")
def cache_stats():
    with db() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as total, MAX(cached_at) as latest FROM products"
        ).fetchone()
    return jsonify(dict(row)), 200


@product_bp.delete("/cache/<barcode>")
def bust_cache(barcode: str):
    with db() as conn:
        conn.execute("DELETE FROM products WHERE barcode = ?", (barcode,))
    return jsonify({"message": f"Cache cleared for {barcode}"}), 200
