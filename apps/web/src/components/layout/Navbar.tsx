import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Button,
} from '@mui/material';
import PaidIcon from '@mui/icons-material/Paid';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';

interface NavbarProps {
  onOpenLogin: () => void;
  totalEmployees?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, totalEmployees }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <AppBar position="sticky" color="primary" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
            <PaidIcon fontSize="small" />
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                ACME Compensation
              </Typography>
              <Chip
                label="Enterprise HR"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  color: 'common.white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Stack>
            {totalEmployees !== undefined && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mt: -0.5 }}>
                Managing {totalEmployees.toLocaleString()} Global Employees
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isAuthenticated && user ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'common.white' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'secondary.light', display: 'block' }}>
                  {user.role === 'HR_ADMIN' ? 'HR Administrator' : user.role}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'secondary.light',
                  color: 'primary.dark',
                  fontWeight: 700,
                  width: 36,
                  height: 36,
                  fontSize: '0.9rem',
                }}
              >
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </Avatar>
              <Tooltip title="Sign Out">
                <IconButton
                  size="small"
                  onClick={() => dispatch(logout())}
                  sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'common.white' } }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<LoginIcon />}
              onClick={onOpenLogin}
              sx={{ fontWeight: 600 }}
            >
              HR Sign In
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
