import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const verifyWithToken = async (tokenValue) => {
    if (!tokenValue) {
      setError('Verification token missing. Please paste it from your email.');
      return;
    }

    setLoading(true);
    setStatus('');
    setError('');
    try {
      const response = await authService.verifyEmail(tokenValue);
      setStatus(response.data.message || 'Email verified successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to verify email. Token may be invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const autoToken = searchParams.get('token');
    if (autoToken) {
      verifyWithToken(autoToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    verifyWithToken(token);
  };

  const handleResend = async () => {
    setResendStatus('');
    setError('');
    if (!user) {
      setError('Log in to request another verification email.');
      return;
    }

    try {
      const response = await authService.resendVerification();
      setResendStatus(response.data.message || 'Verification email sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Verify your EVERMIND account</h2>
          <p className="auth-subtitle">
            Tap the link in your inbox or paste the token below to unlock your full workspace.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {status && <div className="auth-success">{status}</div>}
          {error && <div className="auth-error">{error}</div>}
          {resendStatus && <div className="auth-success">{resendStatus}</div>}

          <div className="auth-fields">
            <input
              type="text"
              className="auth-input"
              placeholder="Verification token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="auth-secondary">
          Didn&apos;t get the email?{' '}
          <button type="button" className="auth-link button-link" onClick={handleResend}>
            Resend verification
          </button>
        </div>

        <div className="auth-secondary">
          <Link to="/login" className="auth-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

