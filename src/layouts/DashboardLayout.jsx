import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Drawer,
  List, ListItemButton, ListItemIcon, ListItemText, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, CircularProgress
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../auth/AuthContext.jsx';
import api from '../config/api';
import { LightbulbCircle,SupervisedUserCircle,PeopleAltTwoTone } from '@mui/icons-material';

const drawerWidth = 240;

// All nav items
const navItems = [
  { label: 'Member Management', icon: <PeopleIcon />, to: '/dashboard/users' },
  { label: 'Event Management', icon: <EventIcon />, to: '/dashboard/events' },
  { label: 'Admin Management', icon: <DashboardIcon />, to: '/dashboard/admins' },
  { label: 'Working Group Management', icon: <LightbulbCircle />, to: '/dashboard/knowledges' },
  { label: 'CEO Info', icon: <SupervisedUserCircle />, to: '/dashboard/ceo' },
  { label: 'Organization', icon: <PeopleAltTwoTone/>, to: '/dashboard/organization' },

];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  console.log("user", user)

  // Handle Change Password
  const handleChangePassword = async () => {
    let errors = {};
    if (!passForm.currentPassword) errors.currentPassword = "Required";
    if (!passForm.newPassword) errors.newPassword = "Required";
    if (!passForm.confirmPassword) errors.confirmPassword = "Required";
    if (passForm.newPassword !== passForm.confirmPassword) errors.confirmPassword = "Passwords do not match";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      await api.post('/admins/change-password', {
        oldPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      setChangePassOpen(false);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormErrors({});
      alert("Password changed successfully");
    } catch (err) {
      console.error(err);
      setFormErrors({ api: err.response?.data?.message || "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  // Sidebar drawer
  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', marginTop: 10 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={400}>Admin Portal</Typography>
        <Typography variant="caption" color="text.secondary">Dashboard</Typography>
      </Box>
      <Divider />

      <List sx={{ flex: 1 }}>
        {navItems
          .filter(item => {
            if (item.label === "Admin Management") {
              return user?.role === "superadmin" || user?.role === "admin";
            }
            return true;
          })

          .map((item) => (
            <ListItemButton
              key={item.to}
              selected={location.pathname === item.to}
              onClick={() => { navigate(item.to); setMobileOpen(false); }}
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
      </List>

      <Divider />
      <Box sx={{ paddingX: 2, paddingTop: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => setChangePassOpen(true)}
        >
          Change Password
        </Button>
      </Box>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={() => { signOut(); navigate('/login'); }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>MMBC Admin Portal</Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Outlet />
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePassOpen} onClose={() => setChangePassOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={passForm.currentPassword}
              onChange={(e) => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              fullWidth
              error={!!formErrors.currentPassword}
              helperText={formErrors.currentPassword}
            />
            <TextField
              label="New Password"
              type="password"
              value={passForm.newPassword}
              onChange={(e) => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
              fullWidth
              error={!!formErrors.newPassword}
              helperText={formErrors.newPassword}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={passForm.confirmPassword}
              onChange={(e) => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              fullWidth
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />
            {formErrors.api && <Typography color="error">{formErrors.api}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePassOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
