// from gpt

import React, { useState, useEffect } from 'react';
import GameCanvas from '../Game/GameCanvas';
import '../../styles/game.css';  // adjust path if your CSS lives elsewhere

export default function PlayPage({ username }) {
  // Total seconds remaining
  const [secondsLeft, setSecondsLeft] = useState(2 * 60);
  // For displaying “M:SS”
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // (Optionally: your socket logic to update scores from server)
  const [scoreboard, setScoreboard] = useState([
    { name: username, score: 0 },
  ]);
  // You could hook this up to socket events inside another useEffect.

  return (
    <div id="game-container">
      <div id="user-greeting">
        Hello, <span id="username">{username}</span>
      </div>

      <div id="game-area">
        <div id="timer-container">
          <h2>Timer</h2>
          <div id="timer">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        <div id="canvas-container">
          <h1 id="game-title">Let The War Begin!</h1>
          {/* Embed your existing GameCanvas here */}
          <GameCanvas username={username} />
        </div>

        <div id="scoreboard-container">
          <h2>Scoreboard</h2>
          <div id="scoreboard">
            {scoreboard.map((entry, i) => (
              <div className="score-entry" key={i}>
                <span className="player-name">{entry.name}</span>
                <span className="player-score">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
