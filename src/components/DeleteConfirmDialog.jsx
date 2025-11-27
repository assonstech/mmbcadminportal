import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function DeleteConfirmDialog({ open, setOpen, onConfirm, memberName }) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{memberName}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => {
            onConfirm();
            setOpen(false);
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
