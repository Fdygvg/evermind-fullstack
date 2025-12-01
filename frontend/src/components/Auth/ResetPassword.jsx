import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const linkToken = searchParams.get('token');
    if (linkToken) {
      setToken(linkToken);
    }
  }, [searchParams]);

  const handleChange = (event) => {
    setPasswords({
      ...passwords,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!token) {
      setError('Reset link is missing a token. Please use the link from your email.');
      return;
    }

    if (passwords.password !== passwords.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        newPassword: passwords.password,
      });
      setStatus(response.data.message || 'Password updated! Redirecting to login...');
      setPasswords({ password: '', confirm: '' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Choose a new password</h2>
          <p className="auth-subtitle">
            Paste the token from your email if it didn&apos;t auto-fill, then set a fresh password.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {status && <div className="auth-success">{status}</div>}
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-fields">
            <input
              type="text"
              name="token"
              className="auth-input"
              placeholder="Reset token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="New password"
              value={passwords.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="confirm"
              className="auth-input"
              placeholder="Confirm password"
              value={passwords.confirm}
              onChange={handleChange}
              required
            />
          </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Saving...' : 'Reset password'}
            </button>
        </form>

        <div className="auth-secondary">
          <Link to="/login" className="auth-link">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

