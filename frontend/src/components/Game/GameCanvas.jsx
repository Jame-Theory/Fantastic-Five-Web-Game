import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function GameCanvas({ username }) {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  // const [players, setPlayers] = useState({});

  // now map username → { position: {x,y}, color: '#rrggbb' }
  const [players, setPlayers] = useState({});

  // our own color (comes from the server on join)
  const [selfColor, setSelfColor] = useState('#e74c3c');

  // our shared server position
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [isConnected, setIsConnected] = useState(false);
  const gridSize = 20;

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
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      socket.emit('join_game', { username, room: 'main' });
    };

    const onDisconnect = () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    };

    const onPlayerJoined = (data) => {
      if (data.username === username) return; // for when user logs in 2x

      console.log('⬆️ player_joined:', data);
      setPlayers(prev => ({
        ...prev,
        [data.username]: { position: data.position, color: data.color }
      }));
    };

    const onPlayerLeft = (data) => {
      console.log('⬇️ player_left:', data);
      setPlayers(prev => {
        const copy = { ...prev };
        delete copy[data.username];
        return copy;
      });
    };

    const onPlayerMoved = (data) => {
      if (data.username === username) { // for when user logs in 2x
        setPosition(data.position);
      } else {
        console.log('➡️ player_moved:', data);
        setPlayers(prev => ({
          ...prev,
          [data.username]: { position: data.position, color: data.color }
        }));
      }

      // setPlayers(prev => ({
      //   ...prev,
      //   [data.username]: { position: data.position, color: data.color }
      // }));
    };

    const onGameState = (data) => {
      console.log('📦 game_state:', data);
      const map = {};
      data.players.forEach(p => {
        if (p.username === username) return;
        map[p.username] = { position: p.position, color: p.color };
      });
      setPlayers(map);
    };

    // Our own initial data
    const onPlayerData = (data) => {
      console.log('🔖 player_data:', data);
      setSelfColor(data.color);
      setPosition(data.position);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_moved', onPlayerMoved);
    socket.on('game_state', onGameState);
    socket.on('player_data', onPlayerData);
    // if (socket && username) {
    //   socket.on('connect', () => {
    //     console.log('Connected to WebSocket server');
    //     setIsConnected(true);
    //     socket.emit('join_game', { username, room: 'main' });
    //   });
    //
    //   socket.on('disconnect', () => {
    //     console.log('Disconnected from WebSocket server');
    //     setIsConnected(false);
    //   });
    //
    //   socket.on('connect_error', (error) => {
    //     console.error('Connection error:', error);
    //     setIsConnected(false);
    //   });
    //
    //   socket.on('player_joined', (data) => {
    //     console.log('Player joined:', data);
    //     setPlayers(prev => ({
    //       ...prev,
    //       [data.username]: {
    //         position: data.position,
    //         color: data.color``
    //       }
    //     }));
    //   });
    //
    //   socket.on('player_left', (data) => {
    //     console.log('Player left:', data);
    //     setPlayers(prev => {
    //       const updated = { ...prev };
    //       delete updated[data.username];
    //       return updated;
    //     });
    //   });
    //
    //   socket.on('player_moved', (data) => {
    //     console.log('Player moved:', data);
    //     setPlayers(prev => ({
    //       ...prev,
    //       [data.username]: {
    //         position: data.position,
    //         color: data.color
    //       }
    //     }));
    //   });
    //
    //   socket.on('game_state', (data) => {
    //     console.log('Game state received:', data);
    //     const newPlayers = {};
    //     data.players.forEach(player => {
    //       newPlayers[player.username] = {
    //         position: player.position,
    //         color: player.color
    //       };
    //     });
    //     setPlayers(newPlayers);
    //   });
    //
    //   // learn our own color & initial position
    //   socket.on('player_data', (data) => {
    //     setSelfColor(data.color);
    //     setPosition(data.position);
    //   });
    // }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_moved', onPlayerMoved);
      socket.off('game_state', onGameState);
      socket.off('player_data', onPlayerData);
    };
    // return () => {
    //   if (socket) {
    //     socket.off('connect');
    //     socket.off('disconnect');
    //     socket.off('player_joined');
    //     socket.off('player_left');
    //     socket.off('player_moved');
    //     socket.off('game_state');
    //   }
    // };
  }, [socket, username]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      let newPosition = { ...position };

      switch (e.key) {
        case 'ArrowUp':
          newPosition.y = Math.max(0, position.y - 1);
          break;
        case 'ArrowDown':
          newPosition.y = Math.min(24, position.y + 1);
          break;
        case 'ArrowLeft':
          newPosition.x = Math.max(0, position.x - 1);
          break;
        case 'ArrowRight':
          newPosition.x = Math.min(24, position.x + 1);
          break;
        default:
          return;
      }

      setPosition(newPosition);
      if (socket && isConnected) {
        socket.emit('move', { position: newPosition });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, socket, isConnected]);

  // Draw the game
  useEffect(() => {
    console.log('🎨 drawing canvas: my position=', position, 'all players=', players);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw other players (in *their* color), skip self
    Object.entries(players).forEach(([name, { position: p, color }]) => {
      // if (name === username) return;
      ctx.fillStyle = color;
      ctx.fillRect(p.x * gridSize, p.y * gridSize, gridSize, gridSize);

      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.fillText(name, p.x * gridSize, p.y * gridSize - 5);
    });
    // Object.entries(players).forEach(([playerName, pos]) => {
    //   ctx.fillStyle = color;
    //   ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
    //   // ctx.fillStyle = '#3498db';
    //   // ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
    //
    //   ctx.fillStyle = '#000';
    //   ctx.font = '10px Arial';
    //   ctx.fillText(playerName, pos.x * gridSize, (pos.y * gridSize) - 5);
    // });

    // Draw current player (in our assigned color)
    // ctx.fillStyle = '#e74c3c';
    ctx.fillStyle = selfColor;
    ctx.fillRect(position.x * gridSize, position.y * gridSize, gridSize, gridSize);

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(username, position.x * gridSize, (position.y * gridSize) - 5);

  }, [position, players, username]);

  return (
    <div className="game-container">
      <h2>Game Canvas</h2>
      <p>Use arrow keys to move. Other players will see you moving.</p>
      {!isConnected && (
        <p className="connection-warning">Connecting to server...</p>
      )}
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ border: '1px solid #000' }}
      />
    </div>
  );
}

export default GameCanvas;