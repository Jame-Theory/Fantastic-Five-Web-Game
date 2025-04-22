# server/db.py
from pymongo import MongoClient
# import os

# MongoDB connection string from environment variable
# mongo_uri = os.environ.get('MONGO_URI', "mongodb://admin:password@mongodb:27017/")
mongo_uri = "mongodb://admin:password@localhost:27017/"

# Connect to MongoDB
try:
    mongo_client = MongoClient(mongo_uri)
    db = mongo_client.game_app_db
    users_collection = db.users
    print(f"Connected to MongoDB") # at {mongo_uri}")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")