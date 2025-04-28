from flask import Blueprint, jsonify
from database import db
test = Blueprint("test", __name__)

@test.route("/api/ping")
def ping():
    return jsonify({"msg": "pong", "collections": db.list_collection_names()})

@test.route("/api/mongo-test")
def ins():
    test1 = db['test']
    test1.insert_one({'one thing': 'not a big fan of the government'})
    return jsonify({"inserted": True, "count": test1.count_documents({})})

@test.route("/api/debug-db")
def debug_db():
    return jsonify({"db_name": db.name, "collections": db.list_collection_names()})
