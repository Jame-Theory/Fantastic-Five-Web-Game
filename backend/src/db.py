# backend/db.py
import json
import sys
import os

from pymongo import MongoClient

# MongoDB connection string from environment variable
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/fantastic_game')
# mongo_uri = "mongodb://admin:password@localhost:27017/"
# docker_db = os.environ.get('DOCKER_DB', "false")

# Connect to MongoDB
try:
    mongo_client = MongoClient(mongo_uri)
    # db = mongo_client.game_app_db
    db = mongo_client.get_database()
    users_collection = db.users
    # print(f"Connected to MongoDB") # at {mongo_uri}")
    # print("using docker compose db")
    # mongo_client = MongoClient("mongo")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")
    print("using local db")
    mongo_client = MongoClient("localhost")
    db = mongo_client["Fantastic-Five"]
    users_collection = db["users"]

# db = mongo_client["Fantastic-Five"]
# users_collection = db["users"]
player_collection = db["players"]