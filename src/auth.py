import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from flask import request, jsonify

from markupsafe import escape

from werkzeug.security import check_password_hash, generate_password_hash

from src.database import player_collection

from flask import render_template

import uuid

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/register', methods=('GET', 'POST'))
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
            
        hashed_password = generate_password_hash(password)
            
        player = {'username': username, 'password': hashed_password}
        player_collection.insert_one(player)

    return render_template() #return render_template('auth/register.html') Need change once get React working

@bp.route('/login', methods=('GET', 'POST'))
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if not username:
            return jsonify({'message': "Didn't send username."}), 400
            
        if not password:
            return jsonify({'message': "Didn't send password."}), 400
        

        return jsonify({'username': username}), 200
    
    return render_template() # return render_template('auth/login.html')


        


