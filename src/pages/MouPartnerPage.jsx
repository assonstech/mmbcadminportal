import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Chip,
  InputAdornment,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Groups2Icon from '@mui/icons-material/Groups2';
import LaunchIcon from '@mui/icons-material/Launch';

import {
  getAllMouPartners,
  createMouPartner,
  updateMouPartner,
  deleteMouPartner,
} from '../controllers/MouPartnerController';
import OverlayLoader from '../components/OverlayLoader';

const initialForm = {
  name: '',
  category: '',
  websiteLink: '',
  iconUrl: null,
};

export default function MouPartnerPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPartners(true);
  }, []);

  useEffect(() => {
    if (!form.iconUrl) return;

    const objectUrl = URL.createObjectURL(form.iconUrl);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.iconUrl]);

  const sortedPartners = useMemo(() => {
    return [...partners].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [partners]);

  const filteredPartners = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return sortedPartners;

    return sortedPartners.filter((item) =>
      [item.name, item.category, item.websiteLink]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    );
  }, [sortedPartners, search]);

  const fetchPartners = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoadingMessage('Loading partners...');
        setLoading(true);
      }

      const result = await getAllMouPartners();

      if (result.success) {
        setPartners(Array.isArray(result.data) ? result.data : []);
      } else {
        alert(result.message || 'Failed to fetch MOU partners');
      }
    } catch (err) {
      console.error('fetchPartners error:', err);
      alert('Failed to fetch MOU partners');
    } finally {
      if (showLoader) {
        setLoading(false);
        setLoadingMessage('Loading...');
      }
    }
  };

  const openCreateDialog = () => {
    if (loading) return;
    setEditId(null);
    setForm(initialForm);
    setPreviewUrl('');
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    if (loading) return;
    setEditId(item.id);
    setForm({
      name: item.name || '',
      category: item.category || '',
      websiteLink: item.websiteLink || '',
      iconUrl: null,
    });
    setPreviewUrl(item.iconUrl || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (loading) return;
    setDialogOpen(false);
    setEditId(null);
    setForm(initialForm);
    setPreviewUrl('');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'iconUrl') {
      const file = files?.[0] || null;

      setForm((prev) => ({
        ...prev,
        iconUrl: file,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name?.trim() || !form.category?.trim() || !form.websiteLink?.trim()) {
      alert('Name, category and website link are required');
      return;
    }

    if (!editId && !form.iconUrl) {
      alert('Icon image is required');
      return;
    }

    try {
      setLoadingMessage(editId ? 'Updating partner...' : 'Creating partner...');
      setLoading(true);

      const result = editId
        ? await updateMouPartner(editId, form)
        : await createMouPartner(form);

      if (result.success) {
        setDialogOpen(false);
        setEditId(null);
        setForm(initialForm);
        setPreviewUrl('');
        await fetchPartners(false);
      } else {
        alert(result.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('handleSubmit error:', err);
      alert('Request failed');
    } finally {
      setLoading(false);
      setLoadingMessage('Loading...');
    }
  };

  const handleDelete = async (id) => {
    if (loading) return;

    const ok = window.confirm('Are you sure you want to delete this partner?');
    if (!ok) return;

    try {
      setLoadingMessage('Deleting partner...');
      setLoading(true);

      const result = await deleteMouPartner(id);

      if (result.success) {
        await fetchPartners(false);
      } else {
        alert(result.message || 'Delete failed');
      }
    } catch (err) {
      console.error('handleDelete error:', err);
      alert('Delete failed');
    } finally {
      setLoading(false);
      setLoadingMessage('Loading...');
    }
  };

  const totalPartners = sortedPartners.length;

  const rows = filteredPartners.map((item) => ({
    id: item.id,
    name: item.name || '-',
    category: item.category || '-',
    websiteLink: item.websiteLink || '-',
    iconUrl: item.iconUrl || '',
    raw: item,
  }));

  const columns = [
    {
      field: 'logo',
      headerName: 'Logo',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          src={params.row.iconUrl || ''}
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: '#f8fafc',
            border: '1px solid #e5e7eb',
          }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: 'Partner Name',
      flex: 1.2,
      minWidth: 220,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <Typography
            sx={{
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 0.8,
      minWidth: 160,
      renderCell: (params) => (
        <Stack justifyContent="center" sx={{ height: '100%' }}>
          <Chip
            label={params.value || '-'}
            size="small"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              width: 'fit-content',
              bgcolor: '#eef2ff',
              color: '#3730a3',
            }}
          />
        </Stack>
      ),
    },
    {
      field: 'websiteLink',
      headerName: 'Website',
      flex: 1.4,
      minWidth: 260,
      sortable: false,
      renderCell: (params) => (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ height: '100%', minWidth: 0 }}
        >
          <Typography
            component="a"
            href={params.value}
            target="_blank"
            rel="noreferrer"
            sx={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {params.value}
          </Typography>
          <LaunchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
        </Stack>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <IconButton
            onClick={() => openEditDialog(params.row.raw)}
            disabled={loading}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #dbeafe',
              '&:hover': { bgcolor: '#dbeafe' },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>

          <IconButton
            onClick={() => handleDelete(params.row.id)}
            disabled={loading}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fee2e2',
              '&:hover': { bgcolor: '#fee2e2' },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f4f7fb',
        background:
          'radial-gradient(circle at top left, rgba(59,130,246,0.07), transparent 24%), radial-gradient(circle at top right, rgba(6,182,212,0.06), transparent 22%), #f4f7fb',
        p: { xs: 2, md: 3 },
      }}
    >
      {loading && <OverlayLoader message={loadingMessage} />}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #0891b2 100%)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        />

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Chip
              label="Partner Management"
              sx={{
                mb: 1.5,
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.14)',
                fontWeight: 700,
                borderRadius: 2,
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: 26, md: 34 },
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
              }}
            >
              MOU Partners Dashboard
            </Typography>
            <Typography
              sx={{
                mt: 1,
                maxWidth: 650,
                color: 'rgba(255,255,255,0.82)',
                fontSize: 14,
              }}
            >
              Manage organizations, partner logos, categories, and website links in one clean and modern interface.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1.15,
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#fff',
              color: '#0f172a',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#e2e8f0',
                boxShadow: 'none',
              },
            }}
          >
            Add New Partner
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 2, position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Total Partners', value: totalPartners, icon: <Groups2Icon /> },
          ].map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.11)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 26 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.14)',
                      color: '#fff',
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
          bgcolor: '#fff',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>
              Partner Directory
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Browse, search, update, and manage partner records.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <TextField
              placeholder="Search partner, category, website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                minWidth: { xs: '100%', sm: 320 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Chip
              label={`${filteredPartners.length} ${filteredPartners.length === 1 ? 'Result' : 'Results'}`}
              sx={{
                height: 40,
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: '#eef2ff',
                color: '#3730a3',
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {filteredPartners.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px dashed #cbd5e1',
            p: 6,
            textAlign: 'center',
            bgcolor: '#fff',
          }}
        >
          <Avatar
            sx={{
              mx: 'auto',
              mb: 2,
              width: 72,
              height: 72,
              bgcolor: '#eef2ff',
              color: '#4f46e5',
              borderRadius: 2.5,
            }}
          >
            <BusinessIcon sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography variant="h6" fontWeight={800} mb={1}>
            No partners found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Add your first MOU partner to start building the directory.
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
            }}
          >
            Add Partner
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            bgcolor: '#fff',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
          }}
        >
          <Box sx={{ height: 560, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                    page: 0,
                  },
                },
              }}
              rowHeight={72}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  borderBottom: '1px solid #e5e7eb',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 800,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #eef2f7',
                  color: '#0f172a',
                  outline: 'none',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8fbff',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#fff',
                },
                '& .MuiDataGrid-toolbarContainer': {
                  padding: 1,
                },
              }}
            />
          </Box>
        </Paper>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            background: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              px: 3,
              py: 2.25,
              color: '#fff',
              background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 22 }}>
              {editId ? 'Update Partner' : 'Add New Partner'}
            </Typography>
            <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.78)', fontSize: 14 }}>
              Fill in the partner details below.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            pt: '24px !important',
            pb: 2,
          }}
        >
          <Box component="form" id="partner-form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Partner Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryOutlinedIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Website Link"
                name="websiteLink"
                value={form.websiteLink}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid #e5e7eb',
                  bgcolor: '#f8fafc',
                }}
              >
                <Typography variant="body2" fontWeight={800} mb={1.5}>
                  Partner Icon
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Avatar
                    src={previewUrl || ''}
                    variant="rounded"
                    sx={{
                      width: 92,
                      height: 92,
                      bgcolor: '#fff',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <ImageOutlinedIcon />
                  </Avatar>

                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      component="label"
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: 'none',
                      }}
                    >
                      {form.iconUrl ? 'Change Image' : 'Upload Image'}
                      <input
                        hidden
                        type="file"
                        name="iconUrl"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </Button>

                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Supported: PNG, JPG, WEBP, SVG
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
          <Button
            onClick={closeDialog}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="partner-form"
            disabled={loading}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 140,
              px: 2.5,
              boxShadow: 'none',
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: '#fff' }} />
            ) : editId ? (
              'Update Partner'
            ) : (
              'Create Partner'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}