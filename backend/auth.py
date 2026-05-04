from database import get_db
import bcrypt

def create_user(data):
    conn = get_db()
    cursor = conn.cursor()

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

    cursor.execute("""
    INSERT INTO users (name, email, password, conditions, goals, allergies, preferences, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["name"],
        data["email"],
        hashed,
        ",".join(data.get("conditions", [])),
        data.get("goals"),
        ",".join(data.get("allergies", [])),
        data.get("preferences"),
        data.get("image")
    ))

    conn.commit()
    conn.close()

def login_user(email, password):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    conn.close()

    if user and bcrypt.checkpw(password.encode(), user["password"].encode()):
        return dict(user)

    return None