import * as React from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Stack, Typography,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { DataGrid, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../config/api';

// ---------------- Admin Field Rules ----------------
const adminFieldRules = {
    username: { Admin: "Required", Staff: "Required" },
    email: { Admin: "Required", Staff: "Required" },
    password: { Admin: "Required", Staff: "Required" },
    role: { Admin: "Required", Staff: "Required" },
    status: { Admin: "Required", Staff: "Required" },
};

// ---------------- Component ----------------
export default function AdminManagement() {
    const [rows, setRows] = React.useState([]);
    const [addEditOpen, setAddEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [currentAdmin, setCurrentAdmin] = React.useState(null);
    const [deleteLoading, setDeleteLoading] = React.useState(false);
    const [loading, setLoading] = React.useState(true);


    const [form, setForm] = React.useState({
        adminId: '',
        username: '',
        password: '',
        email: '',
        role: 'admin',
        status: 'Active',
    });
    const [formErrors, setFormErrors] = React.useState({});
    const [saving, setSaving] = React.useState(false);

    // ✅ Unified Snackbar state
    const [snackbar, setSnackbar] = React.useState({
        open: false,
        message: '',
        severity: 'success', // success, warning, error
    });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // ---------------- Fetch Admins ----------------
    React.useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admins');
            const admins = Array.isArray(res.data.data) ? res.data.data.map(a => ({
                ...a,
                status: a.isActive ? 'Active' : 'Inactive'
            })) : [];
            setRows(admins);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to fetch admins', 'error');
            setRows([]); // fallback
        } finally {
            setLoading(false);
        }
    };


    // ---------------- Field Renderer ----------------
    const renderField = (name, label) => {
        const required = adminFieldRules[name]?.[form.role === 'admin' ? 'Admin' : 'Staff'] === 'Required';
        let type = 'text';
        if (name === 'password') type = 'password';
        if (name === 'email') type = 'email';

        return (
            <TextField
                key={name}
                type={type}
                label={label}
                value={form[name] || ''}
                onChange={(e) => setForm(f => ({ ...f, [name]: e.target.value }))}
                fullWidth
                required={required}
                variant="outlined"
                error={!!formErrors[name]}
                helperText={formErrors[name] || ''}
            />
        );
    };

    // ---------------- Add / Edit Admin ----------------
    const openAddDialog = () => {
        setForm({ adminId: '', username: '', email: '', password: '', role: 'admin', status: 'Active' });
        setFormErrors({});
        setAddEditOpen(true);
    };

    const openEditDialog = (admin) => {
        setForm({
            adminId: admin.adminId,
            username: admin.username,
            email: admin.email,
            password: '',
            role: admin.role,
            status: admin.isActive ? 'Active' : 'Inactive'
        });
        setFormErrors({});
        setAddEditOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            let errors = {};

            const requiredFields = form.adminId
                ? ['email', 'role']
                : ['username', 'email', 'password', 'role'];

            requiredFields.forEach(field => {
                if (!form[field]?.toString().trim()) {
                    errors[field] = 'This field is required';
                }
            });

            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                errors.email = 'Invalid email address';
            }

            setFormErrors(errors);
            if (Object.keys(errors).length > 0) {
                showSnackbar('Please fill all required fields', 'warning');
                setSaving(false);
                return;
            }

            const payload = {
                username: form.username,
                email: form.email,
                role: form.role,
                isActive: form.status === 'Active'
            };

            if (form.adminId) {
                await api.put(`/admins/${form.adminId}`, payload);
                showSnackbar('Admin updated successfully', 'success');
            } else {
                payload.password = form.password;
                await api.post('/admins', payload);
                showSnackbar('Admin added successfully', 'success');
            }

            fetchAdmins();
            setAddEditOpen(false);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to save admin', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ---------------- Delete Admin ----------------
    const openDeleteDialog = (admin) => {
        setCurrentAdmin(admin);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleteLoading(true); // show overlay
            await api.delete(`/admins/${currentAdmin.adminId}`);
            setRows(prev => prev.filter(r => r.adminId !== currentAdmin.adminId));
            showSnackbar('Admin deleted successfully', 'success');
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to delete admin', 'error');
        } finally {
            setDeleteOpen(false);
            setCurrentAdmin(null);
            setDeleteLoading(false); // hide overlay
        }
    };
    // ---------------- Columns ----------------
    const columns = [
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1.5 },
        { field: 'role', headerName: 'Role', width: 120 },
        { field: 'status', headerName: 'Status', width: 120 },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => openEditDialog(params.row)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => openDeleteDialog(params.row)}
                />,
            ],
        },
    ];

    return (
        <Box sx={{ p: 1, height: '100%', boxSizing: 'border-box' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight={700}>Admin Management</Typography>
                <Button variant="contained" onClick={openAddDialog}>Add Admin</Button>
            </Stack>

            <Box sx={{ height: "80vh", width: '100%' }}>
                <DataGrid
                    rows={rows}
                    getRowId={(row) => row.adminId}
                    columns={columns}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    loading={loading}
                />
            </Box>

            {/* Add/Edit Dialog */}
            <Dialog open={addEditOpen} onClose={() => setAddEditOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{form.adminId ? 'Edit Admin' : 'Add Admin'}</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {renderField('username', 'Username')}
                        {renderField('email', 'Email')}
                        {!form.adminId && renderField('password', 'Password')}

                        <TextField
                            select
                            label="Role"
                            value={form.role}
                            onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                            SelectProps={{ native: true }}
                            fullWidth
                        >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                        </TextField>

                        <TextField
                            select
                            label="Status"
                            value={form.status}
                            onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                            SelectProps={{ native: true }}
                            fullWidth
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddEditOpen(false)} disabled={saving}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving && <CircularProgress size={20} />}
                    >
                        {form.adminId ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Delete Admin</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete admin <strong>{currentAdmin?.username}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* ✅ Unified Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            {deleteLoading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(2px)',
                    }}
                >
                    <Box
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            backgroundColor: 'white',
                            boxShadow: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <CircularProgress color="primary" size={60} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Deleting, please wait...
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
