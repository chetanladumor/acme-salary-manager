import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { useDispatch } from 'react-redux';
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F172A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1E293B 0%, #0F172A 100%)',
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            {/* Header Brand */}
            <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'secondary.main',
                  width: 56,
                  height: 56,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                <PaidIcon fontSize="medium" />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                ACME Compensation
              </Typography>
              <Chip
                icon={<SecurityIcon fontSize="small" />}
                label="Restricted HR Personnel Only"
                size="small"
                sx={{ bgcolor: '#F1F5F9', fontWeight: 600, fontSize: '0.75rem' }}
              />
            </Stack>

            <Divider />

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {errorMessage && (
                  <Alert severity="error" onClose={() => setErrorMessage(null)}>
                    {errorMessage}
                  </Alert>
                )}

                <TextField
                  label="HR Corporate Email"
                  type="email"
                  fullWidth
                  required
                  size="medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />

                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  size="medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
                  sx={{ py: 1.25, fontWeight: 700 }}
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                </Button>

                {/* 1-Click Demo Fill Box */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#F8FAFC',
                    borderRadius: 2,
                    border: '1px dashed #CBD5E1',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 500 }}>
                    Demo HR Credentials (1-Click Fill):
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    fullWidth
                    onClick={handleFillDemo}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Load hr@acme.com Credentials
                  </Button>
                </Box>
              </Stack>
            </form>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
