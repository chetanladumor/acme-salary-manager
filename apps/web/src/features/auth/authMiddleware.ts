import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { setCredentials, logout } from './authSlice';

const TOKEN_KEY = 'acme_hr_token';
const USER_KEY = 'acme_hr_user';

export const authListenerMiddleware = createListenerMiddleware();

// Handle auth storage side effects outside pure reducers
authListenerMiddleware.startListening({
  matcher: isAnyOf(setCredentials, logout),
  effect: (action) => {
    try {
      if (setCredentials.match(action)) {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      } else if (logout.match(action)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn('Unable to synchronize auth state to localStorage:', e);
    }
  },
});
