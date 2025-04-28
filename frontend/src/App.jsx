import {useEffect, useState} from 'react';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import GameCanvas from './components/Game/GameCanvas';
import './App.css';
import axios from "axios";
axios.defaults.withCredentials = true

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  const handleLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    // Attempt to restore session
    axios.get('/api/auth/me')
      .then(res => {
        setUser({ username: res.data.username });
      })
      .catch(() => {
        // not logged in or token expired
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
          <h1>Paint the Grid</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#000' }}>Hello, {user.username}!</span>
                <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        {/*<h1>Paint the Grid</h1>*/}
        {/*{user && <button onClick={handleLogout}>Logout</button>}*/}
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