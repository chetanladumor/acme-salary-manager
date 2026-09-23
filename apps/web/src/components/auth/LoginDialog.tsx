import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'common.white',
                p: 1,
                borderRadius: 1.5,
                display: 'flex',
              }}
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                HR Portal Access
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Secure internal employee compensation system
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={2.5}>
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            <TextField
              label="Work Email"
              type="email"
              fullWidth
              required
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Box
              sx={{
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 1.5,
                border: '1px dashed #CBD5E1',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Quick Demo Credentials:
              </Typography>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={handleFillDemo}
                sx={{ textTransform: 'none', fontSize: '0.8rem' }}
              >
                Use hr@acme.com
              </Button>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
