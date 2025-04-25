import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom';
import SignupPage from './pages/Register';
import LoginPage from './pages/Login';
import PlayPage from './pages/Play';               // ← new
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <nav className="App-header">
        <h1>Multiplayer Grid Game</h1>
        {user ? (
          <button onClick={() => setUser(null)}>Logout</button>
        ) : (
          <>
            <Link to="/signup">Sign Up</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </nav>
      <main className="App">
        <Routes>
          <Route
            path="/signup"
            element={<SignupPage />}
          />
          <Route
            path="/login"
            element={<LoginPage setUser={setUser} />}
          />
          <Route
            path="/play"
            element={
              user
                ? <PlayPage username={user.username} />
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/"
            element={
              <Navigate to={user ? "/play" : "/login"} replace />
            }
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
