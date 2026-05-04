"""
AuraScan Backend — Flask + SQLite
Handles: barcode scanning, OCR, OpenFoodFacts lookup with SQLite caching,
         camera capture coordination, and profile-aware analysis.
"""

from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.scan import scan_bp
from routes.product import product_bp
from routes.profile import profile_bp
from routes.history import history_bp
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db()

    app.register_blueprint(scan_bp,    url_prefix="/api/scan")
    app.register_blueprint(product_bp, url_prefix="/api/product")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(history_bp, url_prefix="/api/history")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
