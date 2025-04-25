from flask import Blueprint, request, jsonify
from db import users_collection
import bcrypt
import re

auth_bp = Blueprint('auth_bp', __name__)

def validate_password(password):
    # Debug print
    print(f"Validating password: {password}")
    
    if len(password) < 8:
        print("Password too short")
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        print("Missing uppercase")
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        print("Missing lowercase")
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        print("Missing number")
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        print("Missing special char")
        return False, "Password must contain at least one special character"
    
    print("Password validation passed")
    return True, ""

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    print(f"Signup attempt - Username: {username}, Password: {password}")

    if not username or not password:
        print("Missing username or password")
        return jsonify({'error': 'Username and password are required'}), 400

    # Check if user already exists
    if users_collection.find_one({'username': username}):
        print("Username already exists")
        return jsonify({'error': 'Username already taken'}), 409

    # Validate password
    is_valid, error_message = validate_password(password)
    if not is_valid:
        print(f"Password validation failed: {error_message}")
        return jsonify({'error': error_message}), 400

    # Hash password
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Insert into MongoDB
    users_collection.insert_one({
        'username': username,
        'password': hashed
    })

    print("User created successfully")
    return jsonify({'message': 'Registration successful. Please login.'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Fetch user
    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Success: return username
    return jsonify({'username': username}), 200