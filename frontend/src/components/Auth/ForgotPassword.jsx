import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      setStatus(response.data.message || 'Check your email for further instructions.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset email. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Forgot your password?</h2>
          <p className="auth-subtitle">
            Enter the email you registered with and we&apos;ll send a secure reset link.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {status && <div className="auth-success">{status}</div>}
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-fields">
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending magic link...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-secondary">
          Remembered it?{' '}
          <Link to="/login" className="auth-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

