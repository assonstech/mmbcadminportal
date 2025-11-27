import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function OverlayLoader({ message = 'Loading...' }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        bgcolor: 'rgba(0,0,0,0.4)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={60} sx={{ color: {} }} />
      <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
        {message}
      </Typography>
    </Box>
  );
}
