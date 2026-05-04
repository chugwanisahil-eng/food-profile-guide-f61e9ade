"""
services/ocr.py
OCR pipeline to extract product name and ingredient text from food label images.

Pipeline
--------
1. Preprocess image (denoise, deskew, binarise).
2. Run Tesseract with page-segmentation tuned for labels.
3. Extract product name (first substantial line) and ingredients block.
"""

import io
import re
import logging
import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

from PIL import Image

logger = logging.getLogger(__name__)

# Regex patterns for ingredient detection on labels
_INGREDIENTS_PATTERNS = [
    re.compile(r"ingredient[s]?\s*[:\-](.+)", re.IGNORECASE | re.DOTALL),
    re.compile(r"contains\s*[:\-](.+)",        re.IGNORECASE | re.DOTALL),
]

_NOISE_WORDS = {
    "net", "wt", "weight", "best", "before", "use", "by", "batch",
    "lot", "code", "manufactured", "distributed", "packed",
}


def extract_text(image_bytes: bytes) -> dict:
    """
    Run OCR on *image_bytes*.
    Returns:
        {
          "full_text":    str,   # all OCR output
          "product_name": str,   # best guess at product name
          "ingredients":  str,   # raw ingredients string (may be empty)
          "lines":        list,  # individual cleaned lines
        }
    """
    if not TESSERACT_AVAILABLE:
        logger.warning("[OCR] pytesseract not installed")
        return _empty()

    img = _load_image(image_bytes)
    if img is None:
        return _empty()

    preprocessed = _preprocess(img) if CV2_AVAILABLE else img

    # Try a couple of PSM modes; prefer the one with more text
    best_text = ""
    for psm in (6, 3, 11):
        config = f"--oem 3 --psm {psm}"
        try:
            text = pytesseract.image_to_string(preprocessed, config=config, lang="eng")
            if len(text) > len(best_text):
                best_text = text
        except Exception as e:
            logger.warning("[OCR] tesseract error psm=%d: %s", psm, e)

    lines  = _clean_lines(best_text)
    name   = _extract_name(lines)
    ingr   = _extract_ingredients(best_text)

    logger.info("[OCR] extracted name='%s', ingredients=%d chars", name, len(ingr))
    return {
        "full_text":    best_text,
        "product_name": name,
        "ingredients":  ingr,
        "lines":        lines,
    }


# ──────────────────────────────────────────────
# Image preprocessing
# ──────────────────────────────────────────────

def _load_image(data: bytes) -> Image.Image | None:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        logger.error("[OCR] PIL open failed: %s", e)
        return None


def _preprocess(img: Image.Image) -> Image.Image:
    """
    1. Convert to grayscale
    2. Upscale if small (Tesseract works better at 300 dpi / ~2000px)
    3. Denoise
    4. Adaptive threshold (handles uneven lighting on curved labels)
    5. Deskew
    """
    arr = np.array(img)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    # Upscale
    h, w = gray.shape
    if max(h, w) < 1500:
        scale = 1500 / max(h, w)
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)),
                          interpolation=cv2.INTER_CUBIC)

    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # Adaptive threshold
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=21, C=10,
    )

    # Deskew
    binary = _deskew(binary)

    return Image.fromarray(binary)


def _deskew(img: np.ndarray) -> np.ndarray:
    """Correct small rotation using moment-based skew detection."""
    try:
        coords = np.column_stack(np.where(img < 127))   # dark pixels
        if len(coords) < 100:
            return img
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) < 0.5:
            return img
        h, w = img.shape
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        return cv2.warpAffine(img, M, (w, h),
                              flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return img


# ──────────────────────────────────────────────
# Text extraction helpers
# ──────────────────────────────────────────────

def _clean_lines(text: str) -> list[str]:
    lines = []
    for line in text.splitlines():
        line = line.strip()
        # Remove lines that are too short or look like noise
        if len(line) < 3:
            continue
        # Drop lines with only numbers / special chars
        if re.match(r"^[\d\W]+$", line):
            continue
        lines.append(line)
    return lines


def _extract_name(lines: list[str]) -> str:
    """
    Heuristic: the product name is usually the longest prominent line
    near the top, not a noise/label word.
    """
    candidates = []
    for line in lines[:15]:                  # look only in the first 15 lines
        words = line.split()
        if len(words) < 2:
            continue
        lower_words = {w.lower() for w in words}
        if lower_words & _NOISE_WORDS:       # skip if noise words present
            continue
        candidates.append(line)

    if not candidates:
        return lines[0] if lines else ""

    # Prefer the longest candidate (product names tend to be verbose)
    return max(candidates, key=lambda s: len(s))


def _extract_ingredients(text: str) -> str:
    for pattern in _INGREDIENTS_PATTERNS:
        m = pattern.search(text)
        if m:
            raw = m.group(1).strip()
            # Cut off after a double newline or "Nutritional" section
            raw = re.split(r"\n{2,}|Nutrition|NUTRITION|Allergen", raw)[0]
            return raw.strip()
    return ""


def _empty() -> dict:
    return {"full_text": "", "product_name": "", "ingredients": "", "lines": []}
