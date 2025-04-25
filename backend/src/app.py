from flask import Flask, jsonify
from database import db
from flask_cors import CORS
import logging
import os
import traceback
from datetime import datetime

app = Flask(__name__)
CORS(app)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)