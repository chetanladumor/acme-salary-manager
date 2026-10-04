import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Coins, LogOut, LogIn } from 'lucide-react';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';

interface NavbarProps {
  onOpenLogin?: () => void;
  totalEmployees?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, totalEmployees }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon-box">
          <Coins size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">ACME Compensation</span>
            <span className="badge-tag">Enterprise HR</span>
          </div>
          {totalEmployees !== undefined && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Managing {totalEmployees.toLocaleString()} Global Employees
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {isAuthenticated && user ? (
          <div className="user-profile-badge">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#FFFFFF' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93C5FD' }}>
                {user.role === 'HR_ADMIN' ? 'HR Administrator' : user.role}
              </div>
            </div>

            <div className="avatar">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <button
              className="btn-icon"
              title="Sign Out"
              onClick={() => dispatch(logout())}
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-accent btn-sm"
            onClick={onOpenLogin}
          >
            <LogIn size={16} />
            <span>HR Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
