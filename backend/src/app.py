from flask import Flask, jsonify, request, session
from database import db
from flask_cors import CORS
import logging
import os
import traceback
from datetime import datetime
from log_path import setup_loggers
from james_bp import james

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)
CORS(app)

full_http_logger = setup_loggers()
app.register_blueprint(james)

@app.before_request
def before_log():
    ip = request.remote_addr
    method = request.method
    path = request.path
    username = session.get("username", "anonymous")
    logging.info(f"{ip} {method} {path} {username}" )

@app.after_request
def after_log(response):
    ip = request.remote_addr
    method = request.method
    path = request.path
    username = session.get("username", "anonymous")
    code = response.status_code
    logging.info(f"server responded to {ip} with {code}" )
    # log_safe_http(request, response)
    return response



if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=5000)
    except Exception as e:
        logging.error(f"Fatal server error: {traceback.format_exc()}")