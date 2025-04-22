// client/src/components/Game/GameCanvas.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function GameCanvas({ username }) {
  // console.log("component")
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const gridSize = 20;

  // Initialize socket connection
  // hardcoding localhost!!!!!!!!!!!!!!!!!!!!!!
  useEffect(() => {
    const newSocket = io.connect('http://localhost:5000');
    console.log("initialize socket")
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join game when socket is ready
  useEffect(() => {
    if (socket && username) {

      socket.on('connect', () => {
        socket.emit('join_game', { username, room: 'main' });
        console.log(`${username} connected`);
      });

      socket.on('player_joined', (data) => {
        socket.emit('join_game', { username, room: 'main' });
        setPlayers(prev => ({
          ...prev,
          [data.username]: data.position
        }));
        console.log(`${username} joined`);
      });

      socket.on('player_left', (data) => {
        setPlayers(prev => {
          const updated = { ...prev };
          console.log(`${username} leaving`);
          delete updated[data.username];
          return updated;
        });
      });

      socket.on('player_moved', (data) => {
        setPlayers(prev => ({
          ...prev,
          [data.username]: data.position
        }));
        console.log(`${username} moving`);
      });

      socket.on('game_state', (data) => {
        const newPlayers = {};
        data.players.forEach(player => {
          newPlayers[player.username] = player.position;
        });
        console.log('Game state received')  //', data.players);
        setPlayers(newPlayers);
      });
    }

    return () => {
      if (socket) {
        socket.off('player_joined');
        socket.off('player_left');
        socket.off('player_moved');
        socket.off('game_state');
      }
    };
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
      if (socket) {
        socket.emit('move', { position: newPosition });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, socket]);

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current;
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

    // Draw other players
    Object.entries(players).forEach(([playerName, pos]) => {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);

      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.fillText(playerName, pos.x * gridSize, (pos.y * gridSize) - 5);
    });

    // Draw current player
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(position.x * gridSize, position.y * gridSize, gridSize, gridSize);

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(username, position.x * gridSize, (position.y * gridSize) - 5);

  }, [position, players, username]);

  return (
    <div className="game-container">
      <h2>Game Canvas</h2>
      <p>Use arrow keys to move. Other players will see you moving.</p>
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