import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import adminImage from '../assets/adminImage.png';
import api from '../config/api.js';
import { sendOTP, verifyOTP } from '../controllers/MemberController.js';

export default function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, setSessionExpired } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard/users';
  const primaryColor = theme.palette.primary.main;

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [timer, setTimer] = useState(0);

  // Reset dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ------------------------------
  // SEND OTP (uses resetEmail)
  // ------------------------------
  const handleSendOtp = async () => {
    if (!resetEmail) {
      alert("Please enter your email first");
      return;
    }

    setSendingOtp(true);

    const res = await sendOTP(resetEmail);
    setSendingOtp(false);

    if (!res.data?.success) {
      alert(res.data?.message || "Failed to send OTP");
      return;
    }

    alert("OTP sent to your email!");

    // Countdown 60 sec
    setTimer(60);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ------------------------------
  // RESET PASSWORD (verify OTP first)
  // ------------------------------
  async function handleResetPassword() {
    setResetError('');
    setResetSuccess('');

    if (!resetEmail || !newPassword || !confirmPassword || !otp) {
      setResetError('All fields including OTP are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    // Verify OTP
    setVerifyingOtp(true);
    const otpRes = await verifyOTP(resetEmail, otp);
    setVerifyingOtp(false);
    console.log("optres",otpRes)

    if (!otpRes.data?.success) {
      setResetError( "Invalid OTP");
      return;
    }

    // OTP OK → Reset password
    setResetLoading(true);
    try {
      await api.put('/admins/reset/password', {
        email: resetEmail,
        newPassword
      });

      setToastMessage('Password changed successfully');
      setToastOpen(true);

      resetDialogFields();
      setResetOpen(false);

    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  }

  // ------------------------------
  // LOGIN
  // ------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        navigate(from, { replace: true });
        setSessionExpired(false);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  function resetDialogFields() {
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setResetError('');
    setResetSuccess('');
    setTimer(0);
  }

  // ------------------------------
  // UI (UNCHANGED)
  // ------------------------------
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primaryColor} 0%, #2575fc 100%)`,
        p: 2,
      }}
    >
      {/* PARENT CARD */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          maxWidth: 900,
          width: '100%',
          height: '90%',
          backgroundColor: 'white',
          alignItems: 'stretch',
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        {/* LEFT CARD */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${primaryColor} 0%, #2575fc 100%)`,
            color: 'white',
            textAlign: 'center',
            p: 4,
            borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' },
          }}
        >
          <Box component="img" src={adminImage} sx={{ width: '100%', maxWidth: 300, mt: 3 }} />
        </Box>

        {/* RIGHT CARD */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderRadius: { xs: '0 0 16px 16px', md: '0 16px 16px 0' },
          }}
        >
          <Typography variant="h4" fontWeight={700} align="center" sx={{ color: primaryColor }}>
            Admin Login
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Username or Email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              autoFocus
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text" onClick={() => setResetOpen(true)} sx={{ textTransform: 'none' }}>
                Forgot your password? Reset here
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* RESET PASSWORD DIALOG */}
      <Dialog open={resetOpen} onClose={() => { setResetOpen(false); resetDialogFields(); }}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
          {resetSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resetSuccess}</Alert>}

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />

          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* OTP Row */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label="OTP Code"
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button
              variant="outlined"
              sx={{ width: "160px", textTransform: "none" }}
              onClick={handleSendOtp}
              disabled={sendingOtp || timer > 0}
            >
              {sendingOtp
                ? "Sending..."
                : timer > 0
                  ? `Resend ${timer}s`
                  : "Get OTP"}
            </Button>
          </Box>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => { setResetOpen(false); resetDialogFields(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetLoading || verifyingOtp}
          >
            {resetLoading || verifyingOtp
              ? <CircularProgress size={20} sx={{ color: 'white' }} />
              : "Reset"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success">{toastMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
