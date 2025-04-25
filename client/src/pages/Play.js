// src/pages/Play.js
import React from 'react';
import GameCanvas from '../components/Game/GameCanvas';

function PlayPage({ username }) {
  return <GameCanvas username={username} />;
}

export default PlayPage;
