"""
routes/profile.py
POST /api/profile/register          — create user + profile
POST /api/profile/login             — basic auth
GET  /api/profile/<user_id>         — fetch profile
PUT  /api/profile/<user_id>         — update profile (conditions, goals, allergies, diet)
"""

import json
import hashlib
import logging
from flask import Blueprint, request, jsonify
from database import db

logger = logging.getLogger(__name__)
profile_bp = Blueprint("profile", __name__)


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@profile_bp.post("/register")
def register():
    body = request.get_json(force=True, silent=True) or {}
    name  = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    pwd   = (body.get("password") or "").strip()

    if not all([name, email, pwd]):
        return jsonify({"error": "name, email and password required"}), 400
    if len(pwd) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    try:
        with db() as conn:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
                (name, email, _hash(pwd)),
            )
            user_id = cur.lastrowid
            conn.execute(
                "INSERT INTO user_profiles (user_id) VALUES (?)", (user_id,)
            )
        return jsonify({"user_id": user_id, "name": name, "email": email}), 201
    except Exception as e:
        if "UNIQUE" in str(e):
            return jsonify({"error": "Email already registered"}), 409
        logger.exception("register error")
        return jsonify({"error": "Registration failed"}), 500


@profile_bp.post("/login")
def login():
    body  = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    pwd   = (body.get("password") or "").strip()

    with db() as conn:
        row = conn.execute(
            "SELECT id, name, email FROM users WHERE email=? AND password_hash=?",
            (email, _hash(pwd)),
        ).fetchone()

    if not row:
        return jsonify({"error": "Invalid credentials"}), 401

    user = dict(row)
    profile = _fetch_profile(user["id"])
    return jsonify({"user": user, "profile": profile}), 200


@profile_bp.get("/<int:user_id>")
def get_profile(user_id: int):
    profile = _fetch_profile(user_id)
    if profile is None:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"profile": profile}), 200


@profile_bp.put("/<int:user_id>")
def update_profile(user_id: int):
    body = request.get_json(force=True, silent=True) or {}

    fields = {
        "conditions": body.get("conditions", []),
        "goals":      body.get("goals",      []),
        "allergies":  body.get("allergies",  []),
        "diet":       body.get("diet",       []),
    }
    # Validate: all must be lists
    for k, v in fields.items():
        if not isinstance(v, list):
            return jsonify({"error": f"'{k}' must be an array"}), 400

    with db() as conn:
        conn.execute(
            """INSERT INTO user_profiles (user_id, conditions, goals, allergies, diet, updated_at)
               VALUES (?,?,?,?,?, datetime('now'))
               ON CONFLICT(user_id) DO UPDATE SET
                 conditions=excluded.conditions,
                 goals=excluded.goals,
                 allergies=excluded.allergies,
                 diet=excluded.diet,
                 updated_at=datetime('now')""",
            (
                user_id,
                json.dumps(fields["conditions"]),
                json.dumps(fields["goals"]),
                json.dumps(fields["allergies"]),
                json.dumps(fields["diet"]),
            ),
        )

    return jsonify({"message": "Profile updated", "profile": fields}), 200


def _fetch_profile(user_id: int) -> dict | None:
    with db() as conn:
        row = conn.execute(
            "SELECT * FROM user_profiles WHERE user_id=?", (user_id,)
        ).fetchone()
    if not row:
        return None
    d = dict(row)
    for field in ("conditions", "goals", "allergies", "diet"):
        try:
            d[field] = json.loads(d[field] or "[]")
        except Exception:
            d[field] = []
    return d
