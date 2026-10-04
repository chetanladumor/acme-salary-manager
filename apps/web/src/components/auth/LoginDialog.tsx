import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../features/api/apiSlice';
import { setCredentials } from '../../features/auth/authSlice';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('hr@acme.com');
  const [password, setPassword] = useState('Admin#Pass2026!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const result = await loginApi({ email, password }).unwrap();
      dispatch(setCredentials(result));
      onClose();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>HR Portal Access</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Secure internal employee compensation system
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              disabled={isLoading}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {errorMessage && (
              <div className="alert alert-error">
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                required
                className="input-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="input-text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{ width: '100%' }}
              />
            </div>

            {/* Quick Demo Credentials */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed #CBD5E1',
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Quick Demo Credentials:
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleFillDemo}
                style={{ width: '100%' }}
              >
                Use hr@acme.com
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
