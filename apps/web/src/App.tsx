import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  environment: string;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API responded with HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthResponse) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PaidIcon sx={{ color: 'secondary.light' }} />
            <Typography variant="h6" component="div">
              ACME Salary Manager
            </Typography>
          </Stack>
          <Chip
            label="HR Manager Portal"
            size="small"
            sx={{ bgcolor: 'primary.light', color: 'common.white', fontWeight: 500 }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Workforce Compensation System
            </Typography>
            <Typography variant="subtitle1">
              Internal HR management system initialized for 10,000 global employee records.
            </Typography>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend Connection Status
              </Typography>
              {loading && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Connecting to backend service (/api/health)...
                  </Typography>
                </Stack>
              )}

              {error && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                  <ErrorOutlineIcon color="error" />
                  <Typography variant="body2" color="error">
                    Backend service unreachable: {error}
                  </Typography>
                </Stack>
              )}

              {health && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Service: {health.service} ({health.status.toUpperCase()})
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Environment: {health.environment} | Timestamp: {health.timestamp}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default App;
