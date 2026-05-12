import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
  } from '@mui/material';
  
  const CommonConfirmDialog = ({
    open,
    title = 'Confirm',
    message = '',
    onCancel,
    onConfirm,
    loading = false,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'error',
  }) => {
    return (
      <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
  
        <DialogContent>
          <Typography>{message}</Typography>
        </DialogContent>
  
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
  
          <Button
            variant="contained"
            color={confirmColor}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  export default CommonConfirmDialog;