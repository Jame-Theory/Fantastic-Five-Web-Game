import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useResizeObserver from '@react-hook/resize-observer';

function GameCanvas({ username }) {
  const canvasRef = useRef(null);

  // Ref-map: username → HTMLImageElement (avatars)
  const avatarImages = useRef({});

  const [socket, setSocket] = useState(null);
  // const [players, setPlayers] = useState({});

  // now map username → { position: {x,y}, color: '#rrggbb' }
  const [players, setPlayers] = useState({});

  // our own avatar data-URL
  const [selfAvatar, setSelfAvatar] = useState(null);

  // our own color (comes from the server on join)
  const [selfColor, setSelfColor] = useState('#e74c3c');

  const [serverColors, setServerColors] = useState({});

  // our shared server position
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const dirRef          = useRef(null);
  const moveIntervalRef = useRef(null);

  // keep the latest position in a ref so our interval always uses fresh coords
  const positionRef = useRef(position);
  useEffect(() => { positionRef.current = position }, [position]);


  const [isConnected, setIsConnected] = useState(false);

  const [grid, setGrid] = useState({});
  // key = 'x,y' → { username, color }
  const [leaderboard, setLeaderboard] = useState([]);

  const containerRef = useRef(null);
  const [gridSize, setGridSize] = useState(20);

  const WORLD_COLS = 100, WORLD_ROWS = 100;
  const VIEW_COLS  =  25, VIEW_ROWS  =  25;
  // const gridSize = 20;

  // whenever the container’s height changes, recalc cell size:
  useResizeObserver(containerRef, () => {
    const height = containerRef.current.clientHeight;
    const width  = containerRef.current.clientWidth - 135/* leaderboard width */;
    // choose cell size to exactly fit VIEW_ROWS in height:
    const sizeBasedOnHeight = Math.floor(height / VIEW_ROWS);
    // or fit VIEW_COLS in width:
    const sizeBasedOnWidth  = Math.floor(width  / VIEW_COLS);
    // pick the smaller so we don’t overflow:
    setGridSize(Math.min(sizeBasedOnHeight, sizeBasedOnWidth));
  });

  // helper function for leaderboard
  function recomputeLeaderboard(gridMap) {
    const counts = {};
    Object.values(gridMap).forEach(({ username }) => {
      counts[username] = (counts[username] || 0) + 1;
    });
    // include disconnected players too if zero
    Object.keys(players).concat(username).forEach(u => {
      if (!(u in counts)) counts[u] = 0;
    });
    // turn into sorted array
    const board = Object.entries(counts)
      .map(([user, count]) => ({ user, count }))
      .sort((a,b) => b.count - a.count);
    setLeaderboard(board);
  }

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join game when socket is ready
  useEffect(() => {

    if (!socket || !username) return;

    console.log("🔗 setting up socket listeners, socket:", socket, "username:", username);

    const onConnect = () => {
      // console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      socket.emit('join_game', { username, room: 'main' });
    };

    const onDisconnect = () => {
      // console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      // console.error('Connection error:', error);
      setIsConnected(false);
    };

    const onPlayerJoined = (data) => {
      // data: { username, position, color, avatar }

      if (data.username === username) return; // for when user logs in 2x

      // console.log('⬆️ player_joined:', data);

      // FOR AVATARS
      setPlayers(prev => ({
        ...prev,
        [data.username]: {
          position: data.position,
          color: data.color,
          avatar: data.avatar
        }
      }));

      // cache their avatar image
      if (data.avatar) {
        const img = new Image();
        img.onload = () => {
          avatarImages.current[data.username] = img;
        };
        img.onerror = () => {
          console.warn(`Failed to load avatar for ${data.username}`);
          delete avatarImages.current[data.username];
        };
        img.src = data.avatar;
      }
      /////////////////////////////////////

      // Paint their starting cell immediately
      setGrid(prev => {
        const g = { ...prev, [`${data.position.x},${data.position.y}`]: { username: data.username, color: data.color } };
        recomputeLeaderboard(g);
        return g;
      });

      // remember the new player's color
      setServerColors(prev => ({ ...prev, [data.username]: data.color }));
    };

    const onPlayerLeft = (data) => {
      // console.log('⬇️ player_left:', data);
      setPlayers(prev => {
        const copy = { ...prev };
        delete copy[data.username];
        return copy;
      });
    };

    const onPlayerMoved = (data) => {
      if (data.username === username) { // for when user logs in 2x
        setPosition(data.position);

        //   // in case avatar changed
        if (data.avatar) {
          const img = new Image();
          img.onload = () => {
            avatarImages.current[data.username] = img;
          };
          img.onerror = () => {
            console.warn(`Failed to load avatar for ${data.username}`);
            delete avatarImages.current[data.username];
          };
          img.src = data.avatar;
        }

        // these players are always on backend map, so "keep it fresh"
        setServerColors(prev => ({ ...prev, [data.username]: data.color }));

      } else {
        // console.log('➡️ player_moved:', data);

        // CHANGED FOR AVATARS
        setPlayers(prev => ({
          ...prev,
          [data.username]: {
            position: data.position,
            color: data.color,
            avatar: data.avatar
          }
        }));

        // cache image
        if (data.avatar) {
          const img = new Image();
          img.onload = () => {
            avatarImages.current[data.username] = img;
          };
          img.onerror = () => {
            console.warn(`Failed to load avatar for ${data.username}`);
            delete avatarImages.current[data.username];
          };
          img.src = data.avatar;
        }

        ///////////////////////////////

        setServerColors(prev => ({ ...prev, [data.username]: data.color }));
      }
    };

    const onGameState = (data) => {
      // console.log('📦 game_state:', data);

      // FOR AVATARS
      const map = {};
      data.players.forEach(p => {
        if (p.username === username) return;
        map[p.username] = {
          position: p.position,
          color:    p.color,
          avatar:   p.avatar
        };

        // cache each avatar
        if (p.avatar) {
          const img = new Image();
          img.onload = () => {
            avatarImages.current[p.username] = img;
          };
          img.onerror = () => {
            console.warn(`Failed to load avatar for ${p.username}`);
            delete avatarImages.current[p.username];
          };
          img.src = p.avatar;
        }
      });
      setPlayers(map);

      ///////////////////////////////

      // load *all* players’ colors at once
      setServerColors(prev => {
        const out = { ...prev };
        data.players.forEach(p => { out[p.username] = p.color; });
        return out;
      });
    };

    // Our own initial data
    const onPlayerData = (data) => {
      // data: { username, position, color, avatar }
      // console.log('🔖 player_data:', data);
      setSelfColor(data.color);
      setPosition(data.position);

      if (data.avatar) {
        const img = new Image();
        img.onload = () => {
          avatarImages.current[data.username] = img;
        };
        img.onerror = () => {
          console.warn(`Failed to load avatar for ${data.username}`);
          delete avatarImages.current[data.username];
        };
        setSelfAvatar(data.avatar);
        img.src = data.avatar;
      }

      // Paint starting cell immediately
      setGrid(prev => {
        const g = { ...prev, [`${data.position.x},${data.position.y}`]: { username: username, color: data.color } };
        recomputeLeaderboard(g);
        return g;
      });

      // remember *our* color from the server
      setServerColors(prev => ({ ...prev, [data.username]: data.color }));
    };

    const onGridState = ({ cells, user_colors }) => {
      // build the grid map
      const g = {};
      cells.forEach(c => {
        g[`${c.x},${c.y}`] = { username: c.username, color: c.color };
      });
      setGrid(g);
      recomputeLeaderboard(g);

      // save the authoritative color map from the server
      if (user_colors) {
        setServerColors(user_colors)
      }
    };

    const onCellPainted = (c) => {
      setGrid(prev => {
        const g = {
          ...prev,
          [`${c.x},${c.y}`]: { username: c.username, color:c.color }
        };
        recomputeLeaderboard(g);
        return g;
      });

      // palette update (in case someone’s color changed on the server)
      setServerColors(prev => ({ ...prev, [c.username]: c.color }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_moved', onPlayerMoved);
    socket.on('game_state', onGameState);
    socket.on('player_data', onPlayerData);
    socket.on('grid_state', onGridState);
    socket.on('cell_painted', onCellPainted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_moved', onPlayerMoved);
      socket.off('game_state', onGameState);
      socket.off('player_data', onPlayerData);
      socket.off('grid_state', onGridState);
      socket.off('cell_painted', onCellPainted);
    };
  }, [socket, username]);

  // Handle keyboard input
  // —— zero-delay, snappy pivot, steady repeats ——
  useEffect(() => {
    if (!socket || !isConnected) return;

    const MOVE_RATE = 100;  // milliseconds between moves; tweak to taste
    const keyMap = {
      ArrowUp:    { dx:  0, dy: -1 },
      ArrowDown:  { dx:  0, dy:  1 },
      ArrowLeft:  { dx: -1, dy:  0 },
      ArrowRight: { dx:  1, dy:  0 }
    };

    // perform a move using the very latest position
    const doMove = ({ dx, dy }) => {
      const { x, y } = positionRef.current;
      const nx = Math.max(0, Math.min(WORLD_COLS - 1, x + dx));
      const ny = Math.max(0, Math.min(WORLD_ROWS - 1, y + dy));
      socket.emit('move', { position: { x: nx, y: ny } });
    };

    // start or restart moving in this direction
    const startMoving = (dir) => {
      clearInterval(moveIntervalRef.current);
      dirRef.current = `${dir.dx},${dir.dy}`;
      doMove(dir);  // **instant** first step
      // then rock-steady repeats
      moveIntervalRef.current = setInterval(() => {
        doMove(dir);
      }, MOVE_RATE);
    };

    // stop if we release the active direction
    const stopMoving = (dirKey) => {
      if (dirRef.current === dirKey) {
        clearInterval(moveIntervalRef.current);
        dirRef.current = null;
      }
    };

    const onKeyDown = (e) => {
      const dir = keyMap[e.key];
      if (!dir) return;
      const key = `${dir.dx},${dir.dy}`;
      if (dirRef.current !== key) {
        startMoving(dir);
      }
    };

    const onKeyUp = (e) => {
      const dir = keyMap[e.key];
      if (!dir) return;
      stopMoving(`${dir.dx},${dir.dy}`);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      clearInterval(moveIntervalRef.current);
      dirRef.current = null;
    };
  }, [socket, isConnected]);


  // old movement
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     let newPosition = { ...position };
  //
  //     switch (e.key) {
  //       case 'ArrowUp':
  //         newPosition.y = newPosition.y - 1;
  //         break;
  //       case 'ArrowDown':
  //         newPosition.y = newPosition.y + 1;
  //         break;
  //       case 'ArrowLeft':
  //         newPosition.x = newPosition.x - 1;
  //         break;
  //       case 'ArrowRight':
  //         newPosition.x = newPosition.x + 1;
  //         break;
  //       default:
  //         return;
  //     }
  //
  //     // clamp within 0 .. WORLD−1
  //     newPosition.x = Math.max(0, Math.min(WORLD_COLS - 1, newPosition.x));
  //     newPosition.y = Math.max(0, Math.min(WORLD_ROWS - 1, newPosition.y));
  //
  //     if (socket && isConnected) {
  //       socket.emit('move', { position: newPosition });
  //     }
  //   };
  //
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [position, socket, isConnected]);

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // compute camera origin so player is centered when possible
    const camX = Math.max(
      0,
      Math.min(position.x - Math.floor(VIEW_COLS/2), WORLD_COLS - VIEW_COLS)
    );
    const camY = Math.max(
      0,
      Math.min(position.y - Math.floor(VIEW_ROWS/2), WORLD_ROWS - VIEW_ROWS)
    );

    // clear the 25×25 viewport
    ctx.clearRect(0, 0, VIEW_COLS * gridSize, VIEW_ROWS * gridSize);

    // paint cells that lie within the viewport
    Object.entries(grid).forEach(([key, {color}]) => {
      const [x,y] = key.split(',').map(Number);
      if (x >= camX && x < camX + VIEW_COLS && y >= camY && y < camY + VIEW_ROWS) {
        ctx.fillStyle = color;
        ctx.fillRect(
          (x - camX) * gridSize,
          (y - camY) * gridSize,
          gridSize,
          gridSize
        );
      }
    });

    // draw grid lines for 25×25 cells
    ctx.strokeStyle = '#999'; // darker lines on dark background
    ctx.lineWidth = 1;
    for (let i = 0; i <= VIEW_COLS; i++) {
      const sx = i * gridSize;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, VIEW_ROWS * gridSize);
      ctx.stroke();
    }
    for (let j = 0; j <= VIEW_ROWS; j++) {
      const sy = j * gridSize;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(VIEW_COLS * gridSize, sy);
      ctx.stroke();
    }

    // helper to draw a player square + bordered name
    function drawPlayer(u, pos, color, isSelf=false) {
      const px = (pos.x - camX) * gridSize;
      const py = (pos.y - camY) * gridSize;

      // 1) Choose the right <img> ref:
      //    - if it's you, use the one under your own username
      //    - otherwise, use the one keyed by that other user's name
      const key = isSelf ? username : u;
      const img = avatarImages.current[key];

      // 2) Only draw it once it's fully loaded and valid:
      if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        ctx.drawImage(img, px, py, gridSize, gridSize);
      } else {
        // fallback to a solid-colored square
        ctx.fillStyle = isSelf ? selfColor : color;
        ctx.fillRect(px, py, gridSize, gridSize);
      }

      // border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, gridSize, gridSize);

      // name tag background
      ctx.font = 'bold 12px Arial';
      const textW = ctx.measureText(u).width;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(px - 2, py - 18, textW + 4, 16);

      // name text
      ctx.fillStyle = '#fff';
      ctx.fillText(u, px, py - 4);
    }

    // draw *other* players
    Object.entries(players).forEach(([u,{position:p,color}]) => {
      drawPlayer(u, p, color);
    });

    // draw yourself on top
    drawPlayer(username, position, selfColor, true);

  }, [grid, players, position, selfColor, username]);

  return (
    <div className="game-container" ref={containerRef}>
      {/*<h2>Game Canvas</h2>*/}
      {/*<p>Use arrow keys to move. Other players will see you moving.</p>*/}
      {!isConnected && (
        <p className="connection-warning">Connecting to server...</p>
      )}
      <div>
        <canvas
          ref={canvasRef}
          width={VIEW_COLS * gridSize}
          height={VIEW_ROWS * gridSize}
        />
      </div>

      <div className="leaderboard">
        <h3>Leaderboard</h3>
        <ol>
          {leaderboard.map(({user,count}) => (
            <li
              key={user}
              style={{
                fontWeight: user === username ? 'bold' : 'normal',
                backgroundColor: user === username
                  ? 'rgba(255,255,255,0.2)'
                  : 'transparent',
                padding: user === username ? '2px 4px' : undefined,
                borderRadius: user === username ? '4px' : undefined
              }}
            >
              <span style={{color: serverColors[user] || '#000'}}>
                {user}
              </span>: {count}
            </li>
          ))}

        </ol>
      </div>
    </div>

  );
}

export default GameCanvas;