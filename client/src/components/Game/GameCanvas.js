import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

function GameCanvas({ username }) {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const gridSize = 20;

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io.connect('http://localhost:5000');
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (socket && username) {
      socket.on('connect', () => {
        socket.emit('join_game', { username, room: 'main' });
      });

      socket.on('player_joined', (data) => {
        setPlayers((prev) => ({
          ...prev,
          [data.username]: data.position,
        }));
      });

      socket.on('player_left', (data) => {
        setPlayers((prev) => {
          const updated = { ...prev };
          delete updated[data.username];
          return updated;
        });
      });

      socket.on('player_moved', (data) => {
        setPlayers((prev) => ({
          ...prev,
          [data.username]: data.position,
        }));
      });

      socket.on('game_state', (data) => {
        const newPlayers = {};
        data.players.forEach((p) => {
          newPlayers[p.username] = p.position;
        });
        setPlayers(newPlayers);
      });
    }

    return () => {
      if (socket) {
        ['connect', 'player_joined', 'player_left', 'player_moved', 'game_state'].forEach((ev) => {
          socket.off(ev);
        });
      }
    };
  }, [socket, username]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      let newPos = { ...position };
      if (e.key === 'ArrowUp') newPos.y = Math.max(0, position.y - 1);
      if (e.key === 'ArrowDown') newPos.y = Math.min(24, position.y + 1);
      if (e.key === 'ArrowLeft') newPos.x = Math.max(0, position.x - 1);
      if (e.key === 'ArrowRight') newPos.x = Math.min(24, position.x + 1);
      setPosition(newPos);
if (socket) {
    socket.emit('move', { position: newPos });
  }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, socket]);

  // Draw the game
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 500, 500);
    ctx.strokeStyle = '#ddd';
    for (let i = 0; i <= 500; i += gridSize) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 500); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(500, i); ctx.stroke();
    }

    Object.entries(players).forEach(([name, pos]) => {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
      ctx.fillStyle = '#000'; ctx.font = '10px Arial';
      ctx.fillText(name, pos.x * gridSize, pos.y * gridSize - 5);
    });

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(position.x * gridSize, position.y * gridSize, gridSize, gridSize);
    ctx.fillStyle = '#000'; ctx.font = '10px Arial';
    ctx.fillText(username, position.x * gridSize, position.y * gridSize - 5);
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