from flask import Flask, request, jsonify
from flask_cors import CORS

from auth import create_user, login_user
from database import get_db   # 👈 make sure this import is at top

app = Flask(__name__)
CORS(app)

# 🔹 Test route
@app.route("/")
def home():
    return "Backend is running"

# 🔹 Signup route
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json

    try:
        create_user(data)
        return jsonify({"message": "User created successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# 🔹 Login route ✅ (MOVE HERE)
@app.route("/login", methods=["POST"])
def login():
    print("LOGIN ROUTE HIT")  # debug

    data = request.json
    user = login_user(data["email"], data["password"])

    if user:
        user.pop("password", None)
        return jsonify({
            "message": "Login successful",
            "user": user
        })
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route("/update-profile", methods=["PUT"])
def update_profile():
    data = request.json

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE users
        SET name=?, conditions=?, allergies=?, goals=?, preferences=?
        WHERE id=?
        """, (
            data["name"],
            data["conditions"],
            data["allergies"],
            data["goals"],
            data["preferences"],
            data["id"]
        ))

        conn.commit()
        conn.close()

        return jsonify({"message": "Profile updated successfully"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
    
# 🔹 ALWAYS KEEP THIS LAST
if __name__ == "__main__":
    app.run(debug=True)

