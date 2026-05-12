import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function CommonAlertDialog({
  open,
  title = 'Notice',
  message = '',
  color = 'primary',
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" color={color} onClick={onClose}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}