import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  createPartnerAccount,
  deletePartnerAccount,
  getPartnerAccounts,
  updatePartnerAccount,
} from '../controllers/PartnerAccountController';

const emptyForm = {
  partnerId: '',
  username: '',
  password: '',
  partnerType: '',
  isActive: true,
};

export default function PartnerAccountManagementPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPartnerAccounts(page, limit, search);
      if (res?.success) {
        const data = res.data || {};
        setRows(Array.isArray(data.accounts) ? data.accounts : []);
        setPagination({
          page: data.page || page,
          limit: data.limit || limit,
          total: data.total || 0,
          totalPages: data.totalPages || 1,
        });
      } else {
        setRows([]);
        setPagination({ page, limit, total: 0, totalPages: 1 });
        showSnackbar(res?.message || 'Failed to fetch partner accounts', 'error');
      }
    } catch (err) {
      console.error('fetch partner accounts error:', err);
      setRows([]);
      setPagination({ page, limit, total: 0, totalPages: 1 });
      showSnackbar('Failed to fetch partner accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const validateForm = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = 'Username is required';
    if (!form.partnerType.trim()) nextErrors.partnerType = 'Partner type is required';
    if (!form.partnerId && !form.password.trim()) nextErrors.password = 'Password is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openCreateDialog = () => {
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (account) => {
    setForm({
      partnerId: account.partnerId,
      username: account.username || '',
      password: '',
      partnerType: account.partnerType || '',
      isActive: account.isActive !== false,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showSnackbar('Please fill all required fields', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        partnerType: form.partnerType.trim(),
        isActive: form.isActive,
      };

      if (form.password.trim()) payload.password = form.password;

      const res = form.partnerId
        ? await updatePartnerAccount(form.partnerId, payload)
        : await createPartnerAccount(payload);

      if (res?.success) {
        showSnackbar(form.partnerId ? 'Partner account updated' : 'Partner account created');
        setDialogOpen(false);
        await fetchAccounts();
      } else {
        showSnackbar(res?.message || 'Failed to save partner account', 'error');
      }
    } catch (err) {
      console.error('save partner account error:', err);
      showSnackbar('Failed to save partner account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const res = await deletePartnerAccount(selectedAccount.partnerId);
      if (res?.success) {
        showSnackbar('Partner account deleted');
        setDeleteOpen(false);
        setSelectedAccount(null);
        await fetchAccounts();
      } else {
        showSnackbar(res?.message || 'Failed to delete partner account', 'error');
      }
    } catch (err) {
      console.error('delete partner account error:', err);
      showSnackbar('Failed to delete partner account', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const columns = [
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 180 },
    { field: 'partnerType', headerName: 'Partner Type', flex: 1, minWidth: 180 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdDate',
      headerName: 'Created Date',
      width: 160,
      renderCell: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return Number.isNaN(date.getTime()) ? params.value : date.toLocaleDateString();
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => openEditDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => {
            setSelectedAccount(params.row);
            setDeleteOpen(true);
          }}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>Partner Account Management</Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Search accounts"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            sx={{ minWidth: { sm: 260 } }}
          />
          <Button variant="outlined" onClick={handleSearch} disabled={loading}>
            Search
          </Button>
          <Button variant="text" onClick={handleResetSearch} disabled={loading || (!searchInput && !search)}>
            Reset
          </Button>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="partner-account-limit-label">Limit</InputLabel>
            <Select
              labelId="partner-account-limit-label"
              value={limit}
              label="Limit"
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50].map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={openCreateDialog}>
            Add Partner Login
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.partnerId}
          loading={loading}
          disableRowSelectionOnClick
          hideFooterPagination
        />
      </Box>

      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setPage((prev) => prev - 1)}
          disabled={loading || page <= 1}
        >
          Previous
        </Button>
        <Typography variant="body2">
          Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
          {' '}| Total: {pagination.total} accounts
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={loading || page >= Math.max(pagination.totalPages || 1, 1)}
        >
          Next
        </Button>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.partnerId ? 'Edit Partner Login' : 'Add Partner Login'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
            />
            <TextField
              label={form.partnerId ? 'New Password' : 'Password'}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              error={!!errors.password}
              helperText={errors.password || (form.partnerId ? 'Leave empty to keep current password' : '')}
              fullWidth
            />
            <TextField
              label="Partner Type"
              value={form.partnerType}
              onChange={(e) => setForm((f) => ({ ...f, partnerType: e.target.value }))}
              error={!!errors.partnerType}
              helperText={errors.partnerType}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={form.isActive ? 'Active' : 'Inactive'}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'Active' }))}
              fullWidth
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving && <CircularProgress size={18} />}
          >
            {form.partnerId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Partner Login</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Delete partner login <strong>{selectedAccount?.username}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
