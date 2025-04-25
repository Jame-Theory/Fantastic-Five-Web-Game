import functools

from flask import Flask

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for, make_response
)

from flask import request, jsonify

from markupsafe import escape

from werkzeug.security import check_password_hash, generate_password_hash

from database import player_collection

from flask import render_template

from flask_cors import CORS

import uuid

import secrets
import hashlib
import bcrypt

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
            
        if not username:
            return jsonify({'message': "Didn't send username."}), 400
            
        if not password:
            return jsonify({'message': "Didn't send password."}), 400
            
        username = escape(username)

        if player_collection.find_one({'username': username}):
            return jsonify({'message': 'Username already exists'}), 400
            
        
        salted_hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            
        player = {'username': username, 'password': salted_hashed_password}
        player_collection.insert_one(player)


        # Generates an auth token in string.
        auth_token = secrets.token_bytes(32).hex()

        hashed_auth_token = hashlib.sha256(auth_token.encode()).hexdigest()

        auth_update = player_collection.update_one({"username": username}, {"$set": {"auth_token": hashed_auth_token}})

        response = make_response(jsonify({'username': username}))

        response.set_cookie('auth_token', auth_token, httponly=True, secure=True, max_age=10000)
        
        return response

    

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not username:
            error = make_response(jsonify({'username': None}), 400)
            return error
            
        if not password:
            error = make_response(jsonify({'username': None}), 400)
            return error
        
        username_found = player_collection.find_one({"username": username})

        if not username_found:
            error = make_response(jsonify({'username': None}), 400)
            return error
        
        password_verified = bcrypt.checkpw(password.encode(), username_found["password"].encode())

        if not password_verified:
            error = make_response(jsonify({'username': None}), 400)
            return error
        
        # Generates an auth token in string.
        auth_token = secrets.token_bytes(32).hex()

        hashed_auth_token = hashlib.sha256(auth_token.encode()).hexdigest()

        auth_update = player_collection.update_one({"username": username}, {"$set": {"auth_token": hashed_auth_token}})

        response = make_response(jsonify({'username': username}))

        response.set_cookie('auth_token', auth_token, httponly=True, secure=True, max_age=10000)
        
        return response
    


@bp.route('/logout', methods=['POST'])
def logout():
    token = request.cookies.get('auth_token')

    if not token:
        response = jsonify({'message': "400 Bad Request. No auth_token."})
        return response

    

    hashed_auth_token = hashlib.sha256(token.encode()).hexdigest()

    auth_results = player_collection.find_one({"auth_token": hashed_auth_token})

    if not auth_results:
        response = jsonify({'message': "400 Bad Request. Incorrect auth_token."})
        return response

    
    delete_auth = player_collection.update_one({"auth_token": hashed_auth_token}, {"$unset": {"auth_token": None}})
    

    response = jsonify({'message': 'Logged out'})
    response.set_cookie('auth_token', '', httponly=True, secure=True, max_age=0)
    return response

@bp.route('/status')
def auth_status():
    token = request.cookies.get('auth_token')

    if not token:
        return jsonify({'username': None}), 401
    
    hashed_auth_token = hashlib.sha256(token.encode()).hexdigest()

    auth_results = player_collection.find_one({"auth_token": hashed_auth_token})

    if not auth_results:
        return jsonify({'username': None}), 401
    
    username = list(auth_results)[0]["username"]

    return jsonify({"username": username})


app = Flask(__name__)
app.register_blueprint(bp)

app.config['SECRET_KEY'] = 'secret!'
CORS(app,resources={r"/*":{"origins":"*"}})

@app.route("/api/ping")
def ping():
    return jsonify({"msg": "pong"})


if __name__ == '__main__':
     app.run(debug=True, host='0.0.0.0')
        


