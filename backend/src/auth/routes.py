# backend/auth/routes.py
from flask import Blueprint, request, jsonify
import bcrypt
import datetime

# from db import users_collection
from db import users_collection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if username already exists
    if users_collection.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 409

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create user
    user = {
        "username": username,
        "password": hashed_password.decode('utf-8'),
        "created_at": datetime.datetime.utcnow()
    }

    users_collection.insert_one(user)

    return jsonify({"message": "User created successfully"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Find user
    user = users_collection.find_one({"username": username})

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "message": "Login successful",
        "username": username
    }), 200

############################

# FOR AVATARS

import io, base64
from PIL import Image
from flask import current_app

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Return the current user's avatar as a data URL."""
    # You already have { username } in React state post-login.
    # Here we read it from the request JSON (or you can swap in session/JWT auth).
    username = request.args.get('username')
    if not username:
        return jsonify(error="username required"), 400

    user = users_collection.find_one({"username": username}, {"avatar":1, "avatar_content_type":1})
    if not user or not user.get("avatar"):
        return jsonify(avatar=None)
    data_url = f"data:{user.get('avatar_content_type','image/png')};base64,{user['avatar']}"
    return jsonify(avatar=data_url)

@auth_bp.route('/avatar', methods=['POST'])
def upload_avatar():
    """Accept multipart/form-data file 'avatar', crop & resize to square, store as base64."""
    # again we'll pull username from a query param or form field
    username = request.form.get("username")
    if not username:
        return jsonify(error="username required"), 400
    if "avatar" not in request.files:
        return jsonify(error="No file part"), 400

    file = request.files["avatar"]
    if file.filename == "":
        return jsonify(error="No selected file"), 400

    # validate extension
    ext = file.filename.rsplit(".",1)[-1].lower()
    if ext not in ("png","jpg","jpeg"):
        return jsonify(error="Only PNG/JPG allowed"), 400

    # open & process
    img = Image.open(file.stream)
    w,h = img.size
    m = min(w,h)
    # center crop to square
    left,top = (w-m)//2, (h-m)//2
    img = img.crop((left, top, left+m, top+m))
    # resize to your tile size (e.g. 64×64)
    tile = current_app.config.get("TILE_SIZE", 64)
    # img = img.resize((tile,tile), Image.ANTIALIAS)
    img = img.resize((tile, tile), resample=Image.LANCZOS)

    # encode as PNG
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    # store in Mongo
    users_collection.update_one(
      {"username":username},
      {"$set":{
         "avatar": b64,
         "avatar_content_type":"image/png"
       }}
    )
    return jsonify(message="Avatar uploaded"), 200
