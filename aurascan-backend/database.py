"""
database.py — SQLite schema & connection helpers for AuraScan.

Tables
------
products        — cached OpenFoodFacts data (keyed by barcode)
scan_history    — every scan a user performs
user_profiles   — health goals, allergies, dietary prefs
users           — basic auth records
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("AURASCAN_DB", "aurascan.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row          # rows behave like dicts
    conn.execute("PRAGMA journal_mode=WAL") # better concurrency
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db():
    """Context manager: yields a connection, commits on success, rolls back on error."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist yet."""
    with db() as conn:
        conn.executescript("""
            -- ----------------------------------------------------------------
            -- users
            -- ----------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT    NOT NULL,
                email         TEXT    NOT NULL UNIQUE,
                password_hash TEXT    NOT NULL,
                created_at    TEXT    DEFAULT (datetime('now'))
            );

            -- ----------------------------------------------------------------
            -- user_profiles  (one row per user, upserted on save)
            -- ----------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                conditions TEXT DEFAULT '[]',   -- JSON array
                goals      TEXT DEFAULT '[]',
                allergies  TEXT DEFAULT '[]',
                diet       TEXT DEFAULT '[]',
                updated_at TEXT DEFAULT (datetime('now'))
            );

            -- ----------------------------------------------------------------
            -- products  (OpenFoodFacts cache — keyed by barcode)
            -- ----------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS products (
                barcode      TEXT PRIMARY KEY,
                name         TEXT,
                brand        TEXT,
                image_url    TEXT,
                ingredients  TEXT,              -- raw ingredients string
                nutriments   TEXT,              -- JSON blob from OFF
                allergens    TEXT,              -- JSON array
                labels       TEXT,              -- e.g. organic, vegan
                categories   TEXT,
                off_score    TEXT,              -- Nutri-Score letter
                nova_group   INTEGER,
                ecoscore     TEXT,
                cached_at    TEXT DEFAULT (datetime('now')),
                raw_json     TEXT               -- full OFF product blob
            );

            -- ----------------------------------------------------------------
            -- scan_history
            -- ----------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS scan_history (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
                barcode      TEXT,
                product_name TEXT,
                scan_method  TEXT,              -- 'barcode' | 'ocr' | 'manual'
                verdict      TEXT,              -- 'good' | 'warn' | 'bad'
                verdict_reason TEXT,
                allergen_hits TEXT DEFAULT '[]',-- JSON array of matched allergens
                bookmarked   INTEGER DEFAULT 0,
                scanned_at   TEXT DEFAULT (datetime('now'))
            );

            -- Fast lookups
            CREATE INDEX IF NOT EXISTS idx_history_user    ON scan_history(user_id, scanned_at DESC);
            CREATE INDEX IF NOT EXISTS idx_products_name   ON products(name);
            CREATE INDEX IF NOT EXISTS idx_history_barcode ON scan_history(barcode);
        """)
    print(f"[DB] Initialised → {DB_PATH}")
