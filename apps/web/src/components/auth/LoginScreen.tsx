import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Coins, Lock, Shield } from 'lucide-react';
import { useLoginMutation } from '../../features/api/apiSlice';
import { setCredentials } from '../../features/auth/authSlice';

export const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('hr@acme.com');
  const [password, setPassword] = useState('Admin#Pass2026!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const result = await loginApi({ email, password }).unwrap();
      dispatch(setCredentials(result));
    } catch (err: any) {
      setErrorMessage(
        err?.data?.error?.message || 'Authentication failed. Please verify credentials.'
      );
    }
  };

  const handleFillDemo = () => {
    setEmail('hr@acme.com');
    setPassword('Admin#Pass2026!');
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1E293B 0%, #0F172A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              marginBottom: '12px',
            }}
          >
            <Coins size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            ACME Compensation
          </h2>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F1F5F9',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <Shield size={14} />
            <span>Restricted HR Personnel Only</span>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border)', marginBottom: '24px' }} />

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="alert alert-error">
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              HR Corporate Email
            </label>
            <input
              id="email-input"
              type="email"
              className="input-text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className="input-text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            <Lock size={18} />
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>

          {/* 1-Click Demo Fill Box */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #CBD5E1',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Demo HR Credentials (1-Click Fill):
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleFillDemo}
              style={{ width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Load hr@acme.com Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
