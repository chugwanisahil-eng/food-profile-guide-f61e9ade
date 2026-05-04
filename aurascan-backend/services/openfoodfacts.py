"""
services/openfoodfacts.py
Fetches product data from OpenFoodFacts and caches results in SQLite.
Rate-limit friendly: cache-first, then network.
"""

import json
import logging
import requests
from database import db

logger = logging.getLogger(__name__)

OFF_BASE    = "https://world.openfoodfacts.org/api/v2/product"
OFF_SEARCH  = "https://world.openfoodfacts.org/cgi/search.pl"
CACHE_TTL   = 60 * 60 * 24 * 7        # 7 days in seconds
HEADERS     = {"User-Agent": "AuraScan/1.0 (contact@aurascan.app)"}

# Fields to request from OFF (reduces payload size)
FIELDS = ",".join([
    "product_name", "brands", "image_url",
    "ingredients_text", "nutriments",
    "allergens_tags", "labels_tags", "categories_tags",
    "nutrition_grades", "nova_group", "ecoscore_grade",
])


# ──────────────────────────────────────────────
# Public helpers
# ──────────────────────────────────────────────

def get_by_barcode(barcode: str) -> dict | None:
    """Return product dict for *barcode*. Cache-first, then OFF API."""
    cached = _cache_get(barcode)
    if cached:
        logger.info("[OFF] cache hit  → %s", barcode)
        return cached

    logger.info("[OFF] cache miss → fetching %s", barcode)
    raw = _fetch_by_barcode(barcode)
    if raw:
        _cache_set(barcode, raw)
        return _normalise(raw)
    return None


def search_by_name(name: str, limit: int = 5) -> list[dict]:
    """
    Search OFF by product name.
    Results are cached individually by barcode if they have one.
    """
    # Try SQLite first (partial name match)
    cached = _cache_search(name, limit)
    if cached:
        logger.info("[OFF] name search cache hit → '%s'", name)
        return cached

    logger.info("[OFF] name search network   → '%s'", name)
    return _fetch_by_name(name, limit)


# ──────────────────────────────────────────────
# Network calls
# ──────────────────────────────────────────────

def _fetch_by_barcode(barcode: str) -> dict | None:
    try:
        url = f"{OFF_BASE}/{barcode}.json?fields={FIELDS}"
        r = requests.get(url, headers=HEADERS, timeout=8)
        r.raise_for_status()
        data = r.json()
        if data.get("status") == 1:
            return data.get("product")
    except requests.RequestException as e:
        logger.warning("[OFF] barcode fetch error: %s", e)
    return None


def _fetch_by_name(name: str, limit: int) -> list[dict]:
    try:
        params = {
            "search_terms": name,
            "json": 1,
            "page_size": limit,
            "fields": FIELDS,
            "sort_by": "popularity",
        }
        r = requests.get(OFF_SEARCH, params=params, headers=HEADERS, timeout=10)
        r.raise_for_status()
        products = r.json().get("products", [])
        results = []
        for p in products:
            barcode = p.get("_id") or p.get("code")
            if barcode:
                _cache_set(barcode, p)
            results.append(_normalise(p))
        return results
    except requests.RequestException as e:
        logger.warning("[OFF] name search error: %s", e)
    return []


# ──────────────────────────────────────────────
# SQLite cache helpers
# ──────────────────────────────────────────────

def _cache_get(barcode: str) -> dict | None:
    with db() as conn:
        row = conn.execute(
            """SELECT * FROM products
               WHERE barcode = ?
                 AND (julianday('now') - julianday(cached_at)) * 86400 < ?""",
            (barcode, CACHE_TTL),
        ).fetchone()
    if row:
        return _row_to_dict(row)
    return None


def _cache_search(name: str, limit: int) -> list[dict]:
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM products WHERE name LIKE ? LIMIT ?",
            (f"%{name}%", limit),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def _cache_set(barcode: str, raw: dict):
    norm = _normalise(raw)
    with db() as conn:
        conn.execute(
            """INSERT INTO products
               (barcode, name, brand, image_url, ingredients, nutriments,
                allergens, labels, categories, off_score, nova_group, ecoscore, raw_json)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(barcode) DO UPDATE SET
                 name=excluded.name, brand=excluded.brand,
                 image_url=excluded.image_url, ingredients=excluded.ingredients,
                 nutriments=excluded.nutriments, allergens=excluded.allergens,
                 labels=excluded.labels, categories=excluded.categories,
                 off_score=excluded.off_score, nova_group=excluded.nova_group,
                 ecoscore=excluded.ecoscore, raw_json=excluded.raw_json,
                 cached_at=datetime('now')""",
            (
                barcode,
                norm.get("name"),
                norm.get("brand"),
                norm.get("image_url"),
                norm.get("ingredients"),
                json.dumps(norm.get("nutriments", {})),
                json.dumps(norm.get("allergens", [])),
                json.dumps(norm.get("labels", [])),
                json.dumps(norm.get("categories", [])),
                norm.get("off_score"),
                norm.get("nova_group"),
                norm.get("ecoscore"),
                json.dumps(raw),
            ),
        )


def _row_to_dict(row) -> dict:
    d = dict(row)
    for field in ("nutriments", "allergens", "labels", "categories", "raw_json"):
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except (json.JSONDecodeError, TypeError):
                pass
    return d


# ──────────────────────────────────────────────
# Normalisation
# ──────────────────────────────────────────────

def _normalise(raw: dict) -> dict:
    """Flatten an OFF product blob into a clean AuraScan dict."""
    nutriments = raw.get("nutriments", {})

    def n(key, scale=1):
        """Safe nutriment getter."""
        v = nutriments.get(f"{key}_100g") or nutriments.get(key, 0)
        try:
            return round(float(v) * scale, 2)
        except (TypeError, ValueError):
            return 0

    allergens_raw = raw.get("allergens_tags", [])
    allergens = [a.replace("en:", "").replace("-", " ") for a in allergens_raw]

    return {
        "barcode":     raw.get("_id") or raw.get("code"),
        "name":        raw.get("product_name", "Unknown product"),
        "brand":       raw.get("brands", ""),
        "image_url":   raw.get("image_url", ""),
        "ingredients": raw.get("ingredients_text", ""),
        "allergens":   allergens,
        "labels":      [l.replace("en:", "") for l in raw.get("labels_tags", [])],
        "categories":  [c.replace("en:", "") for c in raw.get("categories_tags", [])[:5]],
        "off_score":   raw.get("nutrition_grades", "").upper(),
        "nova_group":  raw.get("nova_group"),
        "ecoscore":    raw.get("ecoscore_grade", "").upper(),
        "nutriments": {
            "energy_kcal":      n("energy-kcal"),
            "fat":              n("fat"),
            "saturated_fat":    n("saturated-fat"),
            "carbohydrates":    n("carbohydrates"),
            "sugars":           n("sugars"),
            "fiber":            n("fiber"),
            "proteins":         n("proteins"),
            "salt":             n("salt"),
            "sodium":           n("sodium"),
        },
    }
