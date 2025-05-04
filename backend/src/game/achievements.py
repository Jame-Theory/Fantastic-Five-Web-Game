# backend/game/achievements.py
from flask import Blueprint, request, jsonify
from db import users_collection

achievements_bp = Blueprint('achievements', __name__)

@achievements_bp.route('/achievements', methods=['GET'])
def get_achievements():
    """Get the achievements for a user."""
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400

    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # If the user doesn't have achievements yet, return defaults
    achievements = user.get('achievements', {
        "fiftyPoints": False,
        "hundredPoints": False,
        "twoHundredPoints": False
    })

    return jsonify({"achievements": achievements}), 200

@achievements_bp.route('/achievements', methods=['POST'])
def update_achievements():
    """Update the achievements for a user."""
    data = request.get_json()
    username = data.get('username')
    achievements = data.get('achievements')

    if not username or not achievements:
        return jsonify({"error": "Username and achievements are required"}), 400

    # Update the user's achievements in the database
    result = users_collection.update_one(
        {"username": username},
        {"$set": {"achievements": achievements}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "Achievements updated successfully"}), 200

#created this earlier for achievmenets backend.