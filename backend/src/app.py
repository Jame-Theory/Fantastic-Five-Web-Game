# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
# from flask_socketio import SocketIO
from db import db

import logging
import os
import traceback
from datetime import datetime

# app = Flask(__name__)
# CORS(app)

from extensions import socketio
# Create but don't initialize the extensions yet
# socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production

    # Initialize extensions
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*", path='/socket.io')

    # Import blueprints
    from auth.routes import auth_bp
    from game.routes import game_bp

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(game_bp, url_prefix='/api/game')

    # right before `return app`
    print("🗺️ Registered routes:")
    for rule in app.url_map.iter_rules():
        app.logger.info(f"🔍 Route registered: {rule} → {rule.endpoint}")
        print(f" • {rule}  →  {rule.endpoint}")

    @app.route('/')
    def index():
        from flask import jsonify
        return jsonify({"message": "API is running"})

    ####################################

    @app.route("/api/ping")
    def ping():
        return jsonify({"msg": "pong", "collections": db.list_collection_names()})

    @app.route("/api/mongo-test")
    def ins():
        test1 = db['test']
        test1.insert_one({'one thing': 'not a big fan of the government'})
        return jsonify({"inserted": True, "count": test1.count_documents({})})

    @app.route("/api/debug-db")
    def debug_db():
        return jsonify({"db_name": db.name, "collections": db.list_collection_names()})

    return app


if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)