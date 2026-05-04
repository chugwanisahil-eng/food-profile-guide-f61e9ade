"""
routes/history.py
GET    /api/history/<user_id>           — paginated scan history
GET    /api/history/<user_id>/bookmarks — bookmarked scans
PATCH  /api/history/<scan_id>/bookmark  — toggle bookmark
DELETE /api/history/<scan_id>           — delete a scan record
"""

import json
import logging
from flask import Blueprint, request, jsonify
from database import db

logger = logging.getLogger(__name__)
history_bp = Blueprint("history", __name__)


@history_bp.get("/<int:user_id>")
def get_history(user_id: int):
    page  = request.args.get("page",  1,  type=int)
    limit = request.args.get("limit", 20, type=int)
    limit = min(limit, 100)
    offset = (page - 1) * limit

    with db() as conn:
        rows = conn.execute(
            """SELECT h.*, p.image_url, p.brand, p.off_score
               FROM scan_history h
               LEFT JOIN products p ON h.barcode = p.barcode
               WHERE h.user_id = ?
               ORDER BY h.scanned_at DESC
               LIMIT ? OFFSET ?""",
            (user_id, limit, offset),
        ).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) FROM scan_history WHERE user_id=?", (user_id,)
        ).fetchone()[0]

    items = []
    for row in rows:
        d = dict(row)
        try:
            d["allergen_hits"] = json.loads(d.get("allergen_hits") or "[]")
        except Exception:
            d["allergen_hits"] = []
        items.append(d)

    return jsonify({
        "items": items,
        "total": total,
        "page":  page,
        "pages": (total + limit - 1) // limit,
    }), 200


@history_bp.get("/<int:user_id>/bookmarks")
def get_bookmarks(user_id: int):
    with db() as conn:
        rows = conn.execute(
            """SELECT h.*, p.image_url, p.brand, p.off_score
               FROM scan_history h
               LEFT JOIN products p ON h.barcode = p.barcode
               WHERE h.user_id=? AND h.bookmarked=1
               ORDER BY h.scanned_at DESC""",
            (user_id,),
        ).fetchall()
    return jsonify({"bookmarks": [dict(r) for r in rows]}), 200


@history_bp.patch("/<int:scan_id>/bookmark")
def toggle_bookmark(scan_id: int):
    with db() as conn:
        conn.execute(
            "UPDATE scan_history SET bookmarked = 1 - bookmarked WHERE id=?",
            (scan_id,),
        )
        row = conn.execute(
            "SELECT bookmarked FROM scan_history WHERE id=?", (scan_id,)
        ).fetchone()

    if not row:
        return jsonify({"error": "Scan not found"}), 404
    return jsonify({"scan_id": scan_id, "bookmarked": bool(row["bookmarked"])}), 200


@history_bp.delete("/<int:scan_id>")
def delete_scan(scan_id: int):
    with db() as conn:
        conn.execute("DELETE FROM scan_history WHERE id=?", (scan_id,))
    return jsonify({"message": "Deleted"}), 200
