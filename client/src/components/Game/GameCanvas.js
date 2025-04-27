import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../../hooks/useSocket';

function GameCanvas({ username }) {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const gridSize = 20;
  const { isConnected, emit, on, off } = useSocket(username);

  // Socket event handlers
  useEffect(() => {
    if (username) {
      // Handle player joins
      const handlePlayerJoined = (data) => {
        setPlayers((prev) => ({
          ...prev,
          [data.username]: data.position,
        }));
      };
      
      // Handle player leaves
      const handlePlayerLeft = (data) => {
        setPlayers((prev) => {
          const updated = { ...prev };
          delete updated[data.username];
          return updated;
        });
      };
      
      // Handle player movements
      const handlePlayerMoved = (data) => {
        setPlayers((prev) => ({
          ...prev,
          [data.username]: data.position,
        }));
      };
      
      // Handle game state updates
      const handleGameState = (data) => {
        const newPlayers = {};
        data.players.forEach((p) => {
          newPlayers[p.username] = p.position;
        });
        setPlayers(newPlayers);
      };
      
      // Register all event handlers
      on('player_joined', handlePlayerJoined);
      on('player_left', handlePlayerLeft);
      on('player_moved', handlePlayerMoved);
      on('game_state', handleGameState);
      
      return () => {
        // Unregister all event handlers
        off('player_joined', handlePlayerJoined);
        off('player_left', handlePlayerLeft);
        off('player_moved', handlePlayerMoved);
        off('game_state', handleGameState);
      };
    }
  }, [username, on, off]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      let newPos = { ...position };
      if (e.key === 'ArrowUp') newPos.y = Math.max(0, position.y - 1);
      if (e.key === 'ArrowDown') newPos.y = Math.min(24, position.y + 1);
      if (e.key === 'ArrowLeft') newPos.x = Math.max(0, position.x - 1);
      if (e.key === 'ArrowRight') newPos.x = Math.min(24, position.x + 1);
      
      setPosition(newPos);
      
      // Only emit if connected
      if (isConnected) {
        emit('move', { position: newPos });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, emit, isConnected]);

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
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
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