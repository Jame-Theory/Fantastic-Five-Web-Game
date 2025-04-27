# backend/game/routes.py
from flask import Blueprint, request
from flask_socketio import emit, join_room, leave_room

# from app import socketio
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

# keep a record of painted cells: map “x,y” → username
grid_owner: dict[str,str] = {}


# Keep one color per username (defunct?)
user_colors = {}

def generate_color(username):
    """Give each username a distinct hex color (first‐seen wins)."""

    if username in user_colors:
        return user_colors[username]
    color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
    user_colors[username] = color
    return color

    # # might be redundant, idk
    # if username in user_colors:
    #     return user_colors[username]
    #
    # if 'color' in players.get(username, {}):
    #     return players[username]['color']
    #
    # # simple random; you could swap in a color‐palette or HSL‐based spread
    # color = "#{:06x}".format(random.randint(0, 0xFFFFFF))
    # user_colors[username] = color
    # return color

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

    print("   players after:", players)

    # Paint their starting cell immediately
    start = players[username]['position']
    key = f"{start['x']},{start['y']}"
    grid_owner[key] = username
    emit('cell_painted', {
        'x': start['x'],
        'y': start['y'],
        'username': username,
        'color': players[username]['color']
    }, room=room)

    # send this tab its own data
    emit('player_data', players[username], room=sid)

    # send everyone in room the full state
    all_players = list(players.values())
    emit('game_state', {'players': all_players}, room=sid)

    # send everyone the current grid map too
    paint_list = [
        {'x': int(k.split(',')[0]),
         'y': int(k.split(',')[1]),
         'username': u,
         'color': players[u]['color']}
        for k, u in grid_owner.items()
    ]
    emit('grid_state',
         {'cells': paint_list}, room=sid) # sid or room?

    # if this was the first tab (len==1), notify others of a new arrival
    if len(user_sids[username]) == 1:
        emit('player_joined', players[username], room=room, include_self=False)
        print(f"Broadcasted player_joined for {username}")


@socketio.on('move')
def handle_move(data):

    print(f"👉 handle_move called, sid={request.sid}, data={data}")

    sid = request.sid
    username = sid_to_user.get(sid)
    if not username or username not in players:
        return

    # 1) update the shared/canonical position of the player
    new_pos = data['position']
    players[username]['position'] = new_pos
    room = players[username]['room']
    print(f"{username} moved to {new_pos}")

    # 2) paint that cell
    cell_key = f"{new_pos['x']},{new_pos['y']}"
    grid_owner[cell_key] = username

    # 3) broadcast both the move AND the paint
    # broadcast to everyone in room (including tabs with same account)
    emit('player_moved', {
        'username': username,
        'position': new_pos,
        'color': players[username]['color']
    }, room=room)

    emit('cell_painted', {
        'x': new_pos['x'],
        'y': new_pos['y'],
        'username': username,
        'color': players[username]['color']
    }, room=room)
