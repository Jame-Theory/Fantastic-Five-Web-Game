from flask import Flask, jsonify
from database import db

app = Flask(__name__)

@app.route("/api/ping")
def ping():
    return jsonify({"msg": "pong", "collections": db.list_collection_names()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)