import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'acme_hr_token';
const USER_KEY = 'acme_hr_user';

export const getStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const stored = getStoredAuth();

const initialState: AuthState = {
  token: stored.token,
  user: stored.user,
  isAuthenticated: Boolean(stored.token),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      // 100% Pure Reducer - No side effects
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // 100% Pure Reducer - No side effects
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
