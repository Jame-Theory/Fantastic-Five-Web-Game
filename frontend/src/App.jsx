import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import GameCanvas from './components/Game/GameCanvas';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [view, setView] = useState("auth"); // "auth" | "game" | "profile"
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in via session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/check', { withCredentials: true });
        if (response.data.authenticated) {
          setUser({ username: response.data.username });
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      setView("auth");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // as soon as we have a user, show the game
  useEffect(() => {
    if (user) {
      setView("game");
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      {view !== "auth" && (
        <header className="App-header">
          {/*<header className="App-header">*/}
          <h1>Paint the Grid</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#000' }}>Hello, {user.username}!</span>
              <button onClick={() => setView("profile")}>Profile</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </header>
      )}

      <main>

        {/* AUTH */}
        {!user && view === "auth" && (
          <div className="auth-container">
            {showLogin ? (
              <>
                <Login setUser={setUser} />
                <p>
                  Don't have an account? <button onClick={toggleForm}>Sign Up</button>
                </p>
              </>
            ) : (
              <>
                <Signup setUser={setUser} />
                <p>
                  Already have an account? <button onClick={toggleForm}>Login</button>
                </p>
              </>
            )}
          </div>
        )}

        {/* PROFILE */}
        {user && view === "profile" && (
          <Profile
            username={user.username}
            backToGame={() => setView("game")}
          />
        )}

        {/* GAME */}
        {user && view === "game" && (
          <GameCanvas username={user.username} />
        )}
      </main>
    </div>
  );
}

export default App;