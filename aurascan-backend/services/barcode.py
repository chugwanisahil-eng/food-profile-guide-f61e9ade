"""
services/barcode.py
Barcode detection from image bytes using pyzbar + OpenCV preprocessing.

Strategy
--------
1. Decode directly on raw image.
2. If nothing found, try contrast-enhanced grayscale.
3. If still nothing, try a few rotations (handles tilted barcodes).
"""

import io
import logging
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    from pyzbar import pyzbar
    PYZBAR_AVAILABLE = True
except ImportError:
    PYZBAR_AVAILABLE = False

from PIL import Image

logger = logging.getLogger(__name__)


def detect_barcode(image_bytes: bytes) -> str | None:
    """
    Try to find a barcode/QR in *image_bytes*.
    Returns the decoded string or None.
    """
    if not PYZBAR_AVAILABLE:
        logger.warning("[Barcode] pyzbar not installed — barcode scanning disabled")
        return None

    img_pil = _bytes_to_pil(image_bytes)
    if img_pil is None:
        return None

    # Pass 1 — raw image
    result = _decode(img_pil)
    if result:
        return result

    if not CV2_AVAILABLE:
        return None

    # Pass 2 — contrast + sharpen
    img_cv = _pil_to_cv2(img_pil)
    enhanced = _enhance(img_cv)
    result = _decode(Image.fromarray(enhanced))
    if result:
        return result

    # Pass 3 — try small rotations
    for angle in (5, -5, 10, -10, 90, 180, 270):
        rotated = _rotate(img_cv, angle)
        result = _decode(Image.fromarray(rotated))
        if result:
            logger.info("[Barcode] found at rotation %d°", angle)
            return result

    return None


# ──────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────

def _bytes_to_pil(data: bytes) -> Image.Image | None:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        logger.error("[Barcode] PIL open failed: %s", e)
        return None


def _decode(img: Image.Image) -> str | None:
    try:
        codes = pyzbar.decode(img)
        if codes:
            barcode_data = codes[0].data.decode("utf-8").strip()
            barcode_type = codes[0].type
            logger.info("[Barcode] decoded %s → %s", barcode_type, barcode_data)
            return barcode_data
    except Exception as e:
        logger.warning("[Barcode] decode error: %s", e)
    return None


def _pil_to_cv2(img: Image.Image) -> np.ndarray:
    arr = np.array(img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def _enhance(img_cv: np.ndarray) -> np.ndarray:
    """Grayscale + CLAHE contrast + sharpen."""
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    eq = clahe.apply(gray)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(eq, -1, kernel)
    return sharpened


def _rotate(img_cv: np.ndarray, angle: float) -> np.ndarray:
    h, w = img_cv.shape[:2]
    cx, cy = w // 2, h // 2
    M = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
    return cv2.warpAffine(img_cv, M, (w, h), flags=cv2.INTER_LINEAR)
