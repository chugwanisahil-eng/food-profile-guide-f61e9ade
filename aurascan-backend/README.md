# AuraScan Backend — Flask + SQLite

## Stack
- **Flask 3.1** — API server
- **SQLite** (via stdlib `sqlite3`) — product cache + user data
- **OpenCV** — image preprocessing for barcode/OCR
- **pyzbar** — barcode/QR decoding
- **pytesseract** — OCR (wraps Tesseract)
- **OpenFoodFacts API** — nutrition data source

---

## Quick start

### 1. System dependencies

```bash
# Ubuntu / Debian
sudo apt-get install -y tesseract-ocr libzbar0

# macOS
brew install tesseract zbar
```

### 2. Python environment

```bash
cd aurascan-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run

```bash
python app.py
# → http://localhost:5000
```

---

## Environment variables

| Variable        | Default          | Description                     |
|-----------------|------------------|---------------------------------|
| `AURASCAN_DB`   | `aurascan.db`    | SQLite file path                |
| `FLASK_DEBUG`   | `0`              | Enable debug mode               |

Copy `.env.example` → `.env` and adjust.

---

## Frontend wiring

In your React project root, create `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

Then copy the provided `Scan.tsx` and `Result.tsx` into `src/pages/`.

---

## API reference

### Scan
| Method | Path                  | Body / Params               | Description                          |
|--------|-----------------------|-----------------------------|--------------------------------------|
| POST   | `/api/scan/image`     | multipart: `image`, `user_id` | Full pipeline (barcode → OCR → OFF) |
| POST   | `/api/scan/barcode`   | JSON: `barcode`, `user_id`  | Direct barcode lookup                |

### Product (cache)
| Method | Path                          | Description                      |
|--------|-------------------------------|----------------------------------|
| GET    | `/api/product/<barcode>`      | Fetch single product             |
| GET    | `/api/product/search?q=`      | Search by name                   |
| GET    | `/api/product/cache/stats`    | Cache row count + last update    |
| DELETE | `/api/product/cache/<barcode>`| Bust a cached entry              |

### Profile
| Method | Path                       | Body                                   | Description            |
|--------|----------------------------|----------------------------------------|------------------------|
| POST   | `/api/profile/register`    | `name`, `email`, `password`            | Create account         |
| POST   | `/api/profile/login`       | `email`, `password`                    | Sign in                |
| GET    | `/api/profile/<user_id>`   | —                                      | Fetch profile          |
| PUT    | `/api/profile/<user_id>`   | `conditions`, `goals`, `allergies`, `diet` | Update profile     |

### History
| Method | Path                                | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | `/api/history/<user_id>`            | Paginated scan history   |
| GET    | `/api/history/<user_id>/bookmarks`  | Bookmarked scans         |
| PATCH  | `/api/history/<scan_id>/bookmark`   | Toggle bookmark          |
| DELETE | `/api/history/<scan_id>`            | Delete scan record       |

---

## Architecture

```
Image upload
     │
     ▼
┌──────────────┐     hit    ┌─────────────┐
│ Barcode scan │──────────►│  SQLite DB  │
│  (pyzbar +   │           │  (products) │
│   OpenCV)    │    miss    └─────────────┘
└──────┬───────┘              │
       │ no barcode           │ fetch
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐
│  OCR         │────►│ OpenFoodFacts API│
│ (Tesseract + │     │  (rate-limited)  │
│  OpenCV)     │     └──────────────────┘
└──────────────┘
       │
       ▼
┌─────────────────────┐
│  Verdict engine     │  ← user profile (allergies, goals, conditions)
│  (verdict.py)       │
└──────────┬──────────┘
           │
           ▼
    scan_history (SQLite)
           │
           ▼
     JSON response → React frontend
```
