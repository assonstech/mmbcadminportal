// src/components/SessionExpiredDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function SessionExpiredDialog() {
  const { sessionExpired, setSessionExpired, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleOk = async () => {
    setSessionExpired(false);   // hide dialog
    await signOut();            // clear server cookie + client state
    navigate('/login', { replace: true }); // redirect to login
  };

  // Only show dialog if sessionExpired AND current route is NOT /login
  const shouldOpen = Boolean(sessionExpired) && location.pathname !== '/login';

  return (
    <Dialog
      open={shouldOpen}
      onClose={handleOk}
      aria-labelledby="session-expired-title"
    >
      <DialogTitle id="session-expired-title">Session Expired</DialogTitle>
      <DialogContent>
        <Typography>
          Your session has expired. Please sign in again to continue.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOk} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
