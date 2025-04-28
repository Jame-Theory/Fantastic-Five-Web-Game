# backend/auth/routes.py
from flask import Blueprint, request, jsonify
import bcrypt
import datetime

from flask_jwt_extended import create_access_token, unset_jwt_cookies, jwt_required, get_jwt_identity

# from db import users_collection
from db import users_collection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
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

    # return jsonify({
    #     "message": "Login successful",
    #     "username": username
    # }), 200

    # Create a JWT token
    access_token = create_access_token(
        identity = username,
        expires_delta = datetime.timedelta(days=7)
    )
    resp = jsonify({"message": "Login successful", "username": username})
    # Set it in a secure HttpOnly cookie
    resp.set_cookie(
        'access_token_cookie',
        access_token,
        httponly = True,
        secure = False,  # True if you serve over HTTPS
        path = '/api/'
    )

    return resp, 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Clear the JWT cookie
    resp = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(resp)
    return resp, 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    # Return the current user from the JWT in cookie
    current = get_jwt_identity()
    return jsonify({"username": current}), 200