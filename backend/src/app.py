from flask import Flask, jsonify, request, session
from flask_cors import CORS
# from flask_socketio import SocketIO

from db import db
# from database import db

import logging
import os
import traceback
from datetime import datetime
from log_path import setup_loggers
from test_bp import test
from auth.routes import auth_bp
from game.routes import game_bp

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

from flask_jwt_extended import JWTManager

# app = Flask(__name__)
# CORS(app)

from extensions import socketio
# Create but don't initialize the extensions yet
# socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    # app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')

    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_ACCESS_COOKIE_PATH'] = '/api/'
    app.config['JWT_COOKIE_SECURE'] = False  # True in HTTPS/production
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # or True + handle X-CSRF
    jwt = JWTManager(app)

    # Initialize extensions
    CORS(app, supports_credentials=True)
    socketio.init_app(app, cors_allowed_origins="*", path='/socket.io')

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(game_bp, url_prefix='/api/game')
    app.register_blueprint(test)

    # right before `return app`
    print("🗺️ Registered routes:")
    for rule in app.url_map.iter_rules():
        app.logger.info(f"🔍 Route registered: {rule} → {rule.endpoint}")
        print(f" • {rule}  →  {rule.endpoint}")

    @app.route('/')
    def index():
        from flask import jsonify
        return jsonify({"message": "API is running"})

    full_http_logger = setup_loggers()

    @app.before_request
    def before_log():
        ip = request.remote_addr
        method = request.method
        path = request.path
        username = session.get("username", "anonymous")
        logging.info(f"{ip} {method} {path} {username}")

    @app.after_request
    def after_log(response):
        ip = request.remote_addr
        code = response.status_code
        logging.info(f"server responded to {ip} with {code}")
        # log_safe_http(request, response)
        return response

    return app

    ####################################


if __name__ == '__main__':
    try:
        app = create_app()
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logging.error(f"Fatal server error: {traceback.format_exc()}")