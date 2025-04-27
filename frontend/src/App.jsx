import { useState } from 'react';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import GameCanvas from './components/Game/GameCanvas';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Multiplayer Grid Game</h1>
        {user && <button onClick={handleLogout}>Logout</button>}
      </header>

      <main>
        {!user ? (
          <div className="auth-container">
            {showLogin ? (
              <>
                <Login setUser={setUser} />
                <p>
                  Don't have an account?{' '}
                  <button onClick={toggleForm}>Sign Up</button>
                </p>
              </>
            ) : (
              <>
                <Signup setUser={setUser} />
                <p>
                  Already have an account?{' '}
                  <button onClick={toggleForm}>Login</button>
                </p>
              </>
            )}
          </div>
        ) : (
          <GameCanvas username={user.username} />
        )}
      </main>
    </div>
  );
}

export default App;