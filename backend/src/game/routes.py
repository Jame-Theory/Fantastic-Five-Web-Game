# backend/game/routes.py
from flask import Blueprint, request
from flask_socketio import emit, join_room, leave_room

# from app import socketio
# from backend.app import socketio
from extensions import socketio

# import sys
# socketio = sys.modules[__name__].socketio

game_bp = Blueprint('game', __name__)

# Store active players and their positions
players = {}

# Register socket events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")
    if request.sid in players:
        username = players[request.sid]['username']
        room = players[request.sid]['room']
        del players[request.sid]
        emit('player_left', {'username': username}, room=room)
        print(f"{username} disconnected from {room}")


@socketio.on('join_game')
def handle_join(data):

    print(f"👉 handle_join called, sid={request.sid}, data={data}")
    print("   players before:", players)

    username = data.get('username')
    room = data.get('room', 'main')

    # Store player info
    players[request.sid] = {
        'username': username,
        'position': {'x': 0, 'y': 0},
        'room': room
    }

    print("   players after:", players)

    # Join the room
    join_room(room)

    # Notify others
    emit('player_joined', {
        'username': username,
        'position': players[request.sid]['position']
    }, room=room, include_self=False)

    # Send existing players to new player
    existing_players = []
    for sid, player in players.items():
        if sid != request.sid and player['room'] == room:
            existing_players.append({
                'username': player['username'],
                'position': player['position']
            })

    print(f"{username} joined room {room}")
    # print(f"Current players: {players}")
    print(f"Current players: {existing_players}")

    emit('game_state', {'players': existing_players})

    print(f"Server: {username} joined room {room}")


@socketio.on('move')
def handle_move(data):

    print(f"👉 handle_move called, sid={request.sid}, data={data}")

    if request.sid in players:
        players[request.sid]['position'] = data['position']
        room = players[request.sid]['room']

        print("   players now:", players)

        # Broadcast position to everyone in the room except sender
        emit('player_moved', {
            'username': players[request.sid]['username'],
            'position': data['position']
        }, room=room, include_self=False)

        # optionally:
        # state = [
        #     {'username': p['username'], 'position': p['position']}
        #     for p in players.values() if p['room'] == room
        # ]
        # emit('game_state', {'players': state}, room=room)

        print(f"Server: {players[request.sid]['username']} moved to {data['position']}")