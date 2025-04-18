import os
from flask import Flask
from flask import request, jsonify
from src.database import player_collection

from markupsafe import escape

from werkzeug.security import generate_password_hash, check_password_hash

from flask import render_template


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        MONGO_URI='mongodb://localhost:27017/mydatabase'  # change 'mydatabase' to your DB name
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    


    from . import auth
    app.register_blueprint(auth.bp)
    
    return app



    