import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from './authSlice';

describe('authSlice (Pure Reducers)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'hr@acme.com',
    name: 'Sarah Jenkins',
    role: 'HR_ADMIN',
  };

  it('handles initial state cleanly', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state).toHaveProperty('isAuthenticated');
  });

  it('purely sets credentials on setCredentials action without mutating original state', () => {
    const initialState = {
      user: null,
      token: null,
      isAuthenticated: false,
    };

    const nextState = authReducer(
      initialState,
      setCredentials({ user: mockUser, token: 'mock-jwt-token' })
    );

    // Assert new state
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(mockUser);
    expect(nextState.token).toBe('mock-jwt-token');

    // Assert purity (original state unchanged)
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBeNull();
  });

  it('purely clears credentials on logout action without mutating original state', () => {
    const loggedInState = {
      user: mockUser,
      token: 'active-token',
      isAuthenticated: true,
    };

    const nextState = authReducer(loggedInState, logout());

    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();

    // Original state untouched
    expect(loggedInState.isAuthenticated).toBe(true);
  });
});
