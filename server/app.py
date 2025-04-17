from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

# MongoDB Setup
client = MongoClient(os.getenv("MONGO_URI"))
db = client["user_db"]
users = db["users"]

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    existing_user = users.find_one({"email": data['email']})
    if existing_user:
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = generate_password_hash(data['password'], method='sha256')
    user = {
        "username": data['username'],
        "email": data['email'],
        "password": hashed_pw
    }
    users.insert_one(user)
    return jsonify({"message": "Signup successful"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = users.find_one({"email": data['email']})
    if user and check_password_hash(user['password'], data['password']):
        return jsonify({"message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')