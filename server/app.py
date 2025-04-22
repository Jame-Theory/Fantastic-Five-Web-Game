# server/app.py
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# Create but don't initialize the extensions yet
socketio = SocketIO()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production

    # Initialize extensions
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Import blueprints
    from auth.routes import auth_bp
    from game.routes import game_bp

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(game_bp, url_prefix='/api/game')

    @app.route('/')
    def index():
        from flask import jsonify
        return jsonify({"message": "API is running"})

    return app


if __name__ == '__main__':
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)