# backend/game/routes.py
from flask import Blueprint, request
from flask_socketio import emit, join_room, leave_room

# from app import socketio
# from backend.app import socketio
from extensions import socketio

import random

game_bp = Blueprint('game', __name__)

# Store active players and their positions
# username: { username, position:{x,y}, room, color }
players = {}

# which sockets belong to which username
# username: set(sid1, sid2, ...)
user_sids = {}

# reverse lookup
# sid: username
sid_to_user = {}

# Keep one color per username
user_colors = {}

def generate_color(username):
    """Give each username a distinct hex color (first‐seen wins)."""
    if 'color' in players.get(username, {}):
        return players[username]['color']
    # if username in user_colors:
    #     return user_colors[username]
    # simple random; you could swap in a color‐palette or HSL‐based spread
    color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
    user_colors[username] = color
    return color

# Register socket events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    user = sid_to_user.get(sid)
    if not user:
        print(f"Unknown sid disconnected: {sid}")
        return

    # remove this connection
    user_sids[user].discard(sid)
    sid_to_user.pop(sid, None)
    print(f"{user} disconnected SID {sid}. Remaining tabs: {len(user_sids[user])}")

    # if no more tabs for this user, fully remove them
    if not user_sids[user]:
        room = players[user]['room']
        players.pop(user, None)
        user_sids.pop(user, None)
        emit('player_left', {'username': user}, room=room)
        print(f"{user} left room {room} (all tabs closed)")

    # print(f"Client disconnected: {request.sid}")
    # if request.sid in players:
    #     username = players[request.sid]['username']
    #     room = players[request.sid]['room']
    #     del players[request.sid]
    #     emit('player_left', {'username': username}, room=room)
    #     print(f"{username} disconnected from {room}")


@socketio.on('join_game')
def handle_join(data):

    print(f"👉 handle_join called, sid={request.sid}, data={data}")
    print("   players before:", players)

    username = data.get('username')
    room = data.get('room', 'main')
    sid = request.sid

    # if first time ever, create the player
    if username not in players:
        players[username] = {
            'username': username,
            'position': {'x': 0, 'y': 0},
            'room': room,
            'color': generate_color(username)
        }
        user_sids[username] = set()

    # register this sid
    user_sids[username].add(sid)
    sid_to_user[sid] = username
    join_room(room)
    print(f"{username} joined SID={sid}; tabs now={len(user_sids[username])}")

    # # Join the room
    # # Always let the socket join the room so it can receive broadcasts.
    # join_room(room)
    #
    # # If this username is *already* in the game, it’s a duplicate tab:
    # # just send state and their color back—but don’t add a second square.
    # first_seen = next((sid for sid, p in players.items()
    #                    if p['username'] == username and p['room'] == room), None)
    # color = generate_color(username)
    #
    # if first_seen:
    #     # tell *this* tab its own color + current position
    #     emit('player_data', {
    #         'username': username,
    #         'position': players[first_seen]['position'],
    #         'color': color
    #     })
    #     # broadcast full state (including the original) to this tab
    #     state = [
    #         {'username': p['username'], 'position': p['position'], 'color': p['color']}
    #         for p in players.values() if p['room'] == room
    #     ]
    #     emit('game_state', {'players': state})
    #     return
    #
    # # first time this username logs in -> register them
    # # Store player info
    # players[request.sid] = {
    #     'username': username,
    #     'position': {'x': 0, 'y': 0},
    #     'room': room,
    #     'color': color
    # }

    print("   players after:", players)

    # send this tab its own data
    emit('player_data', players[username], room=sid)

    # send everyone in room the full state
    all_players = list(players.values())
    emit('game_state', {'players': all_players}, room=sid)

    # if this was the first tab (len==1), notify others of a new arrival
    if len(user_sids[username]) == 1:
        emit('player_joined', players[username], room=room, include_self=False)
        print(f"Broadcasted player_joined for {username}")

    # # tell this tab its own color + starting position
    # emit('player_data', {
    #     'username': username,
    #     'position': players[request.sid]['position'],
    #     'color': color
    # })
    #
    # # Notify others
    # emit('player_joined', {
    #     'username': username,
    #     'position': players[request.sid]['position'],
    #     'color': color
    # }, room=room, include_self=False)
    #
    # # Send existing players to new player
    # existing_players = []
    # for sid, player in players.items():
    #     if sid != request.sid and player['room'] == room:
    #         existing_players.append({
    #             'username': player['username'],
    #             'position': player['position'],
    #             'color': player['color']
    #         })
    #
    # print(f"{username} joined room {room}")
    # # print(f"Current players: {players}")
    # print(f"Current players: {existing_players}")
    #
    # emit('game_state', {'players': existing_players})
    #
    # print(f"Server: {username} joined room {room}")


@socketio.on('move')
def handle_move(data):

    print(f"👉 handle_move called, sid={request.sid}, data={data}")

    sid = request.sid
    username = sid_to_user.get(sid)
    if not username or username not in players:
        return

    # update the canonical position
    new_pos = data['position']
    players[username]['position'] = new_pos
    room = players[username]['room']
    print(f"{username} moved to {new_pos}")

    # broadcast to everyone in room (including mover tabs)
    emit('player_moved', {
        'username': username,
        'position': new_pos,
        'color': players[username]['color']
    }, room=room)

    # if request.sid in players:
    #     # players[request.sid]['position'] = data['position']
    #     # room = players[request.sid]['room']
    #
    #     # Update position
    #     pl = players[request.sid]
    #     pl['position'] = data['position']
    #     room = pl['room']
    #
    #     print("   players now:", players)
    #
    #     # Broadcast position to everyone in the room except sender
    #     emit('player_moved', {
    #         'username': pl['username'],
    #         'position': pl['position'],
    #         'color': pl['color']
    #     }, room=room, include_self=False)
    #     emit('player_moved', {
    #          'username': players[request.sid]['username'],
    #          'position': data['position']
    #     }, room=room, include_self=False)

        # optionally:
        # state = [
        #     {'username': p['username'], 'position': p['position']}
        #     for p in players.values() if p['room'] == room
        # ]
        # emit('game_state', {'players': state}, room=room)

    # print(f"Server: {players[request.sid]['username']} moved to {data['position']}")