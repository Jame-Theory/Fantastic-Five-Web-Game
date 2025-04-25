import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push('At least 8 characters long');
    if (!/[A-Z]/.test(pass)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(pass)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(pass)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('At least one special character');
    return errors;
  };

  useEffect(() => {
    setPasswordErrors(validatePassword(password));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Please fix password requirements before submitting');
      return;
    }

    try {
      const response = await axios.post('/api/auth/signup', { username, password });
      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const isFormValid = () => {
    return (
      username.length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword &&
      passwordErrors.length === 0
    );
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <div className="password-requirements">
            <small>Password must meet the following requirements:</small>
            <ul>
              <li className={password.length >= 8 ? 'valid' : 'invalid'}>
                At least 8 characters long
              </li>
              <li className={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>
                At least one uppercase letter
              </li>
              <li className={/[a-z]/.test(password) ? 'valid' : 'invalid'}>
                At least one lowercase letter
              </li>
              <li className={/[0-9]/.test(password) ? 'valid' : 'invalid'}>
                At least one number
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : 'invalid'}>
                At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
              </li>
            </ul>
          </div>
        </div>
        <div>
          <label>Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={!isFormValid()}
          className={!isFormValid() ? 'disabled' : ''}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default SignupPage;