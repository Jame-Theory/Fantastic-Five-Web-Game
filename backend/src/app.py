from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS

# from flask_socketio import SocketIO

from db import db
# from database import db

import logging
import os
import traceback

from datetime import datetime
from log_path import setup_loggers, log_safe_http
from test_bp import test
from auth.routes import auth_bp
from game.routes import game_bp
# from game.achievements import achievements_bp  # Uncomment if using separate blueprint

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

from extensions import socketio

def create_app():
    app = Flask(
        __name__,
        static_url_path='',
        static_folder='public')

    app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production

    # Make sure the folder exists on disk:
    os.makedirs(os.path.join(app.static_folder, 'avatars'), exist_ok=True)

    # Initialize extensions
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*", path='/socket.io')

    @app.route('/avatars/<filename>')
    def serve_avatar(filename):
        # will serve from public/avatars/filename
        return send_from_directory(
            os.path.join(app.static_folder, 'avatars'),
            filename
        )

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(game_bp, url_prefix='/api/game')
    # app.register_blueprint(achievements_bp, url_prefix='/api/game')  # Uncomment if using separate blueprint
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
        logging.info(f"{session} - poiuytrewq")
        logging.info(f"{ip} {method} {path} {username}")

    @app.after_request
    def after_log(response):
        log_safe_http(request, response)
        return response

    return app

if __name__ == '__main__':
    try:
        app = create_app()
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logging.error(f"Fatal server error: {traceback.format_exc()}")