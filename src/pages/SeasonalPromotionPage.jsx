import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { baseImageURL } from '../config/api';
import {
  createSeasonalPromotion,
  deleteSeasonalPromotion,
  getAllSeasonalPromotions,
  updateSeasonalPromotion,
} from '../controllers/SeasonalPromotionController';
import { sendNotification } from '../controllers/MemberController';
import { createNotification, getCreatedReferenceId } from '../controllers/NotificationController';
import CommonAlertDialog from '../components/CommonAlertDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const initialForm = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  startDate: '',
  endDate: '',
  isActive: true,
  imageUrl: null,
  pdfUrl: null,
};

export default function SeasonalPromotionPage() {
  const [rows, setRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState('');
  const [existingPdfUrl, setExistingPdfUrl] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    message: '',
    color: 'primary',
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: '',
  });

  const fetchPromotions = async () => {
    setTableLoading(true);
    try {
      const res = await getAllSeasonalPromotions();
      if (res?.success) {
        setRows(res.data || []);
      } else {
        setRows([]);
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Failed to fetch seasonal promotions',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to fetch seasonal promotions:', err);
      setRows([]);
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to fetch seasonal promotions',
        color: 'error',
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setImagePreview('');
    setExistingPdfUrl('');
    setSubmitAttempted(false);
  };

  const formErrors = {
    title: !form.title.trim(),
    shortDescription: !form.shortDescription.trim(),
    fullDescription: !form.fullDescription.trim(),
    startDate: !form.startDate,
    endDate: !form.endDate,
    imageUrl: !imagePreview,
  };

  const isFormValid = !Object.values(formErrors).some(Boolean);

  const handleCloseDialog = () => {
    if (submitLoading) return;
    setOpenDialog(false);
    resetForm();
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = (row) => {
    setEditingId(row.promotionId);
    setForm({
      title: row.title || '',
      shortDescription: row.shortDescription || '',
      fullDescription: row.fullDescription || '',
      startDate: formatDateTimeLocal(row.startDate),
      endDate: formatDateTimeLocal(row.endDate),
      isActive: !!row.isActive,
      imageUrl: null,
      pdfUrl: null,
    });
    setImagePreview(row.imageUrl ? `${baseImageURL}${row.imageUrl}` : '');
    setExistingPdfUrl(row.pdfUrl ? `${baseImageURL}${row.pdfUrl}` : '');
    setSubmitAttempted(false);
    setOpenDialog(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      imageUrl: file,
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      pdfUrl: file,
    }));
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isFormValid) {
      setAlertDialog({
        open: true,
        title: 'Validation',
        message: 'Please fill all required fields',
        color: 'warning',
      });
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        ...form,
        isActive: !!form.isActive,
        startDate: form.startDate || '',
        endDate: form.endDate || '',
      };

      const res = editingId
        ? await updateSeasonalPromotion(editingId, payload)
        : await createSeasonalPromotion(payload);

      if (res?.success) {
        if (!editingId) {
          await sendNotification(
            'New Seasonal Promotion',
            `"${form.title}" is now available.`
          );
          await createNotification({
            title: form.title,
            description: form.shortDescription || form.fullDescription,
            type: 'SEASONALPROMOTION',
            referenceId: getCreatedReferenceId(res, ['promotionId', 'seasonalPromotionId']),
          });
        }

        setOpenDialog(false);
        resetForm();
        await fetchPromotions();

        setAlertDialog({
          open: true,
          title: 'Success',
          message: editingId
            ? 'Promotion updated successfully'
            : 'Promotion created successfully',
          color: 'success',
        });
      } else {
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Failed to save promotion',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Save promotion error:', err);
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to save promotion',
        color: 'error',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      id: row.promotionId,
      name: row.title || 'this promotion',
    });
  };

  const handleConfirmDelete = async () => {
    const id = deleteDialog.id;
    if (!id) return;

    setDeleteLoadingId(id);

    try {
      const res = await deleteSeasonalPromotion(id);
      if (res?.success) {
        await fetchPromotions();
        setAlertDialog({
          open: true,
          title: 'Success',
          message: 'Promotion deleted successfully',
          color: 'success',
        });
      } else {
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Delete failed',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Delete promotion error:', err);
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Delete failed',
        color: 'error',
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'imageUrl',
        headerName: 'Image',
        width: 110,
        sortable: false,
        renderCell: (params) => {
          const image = params.row.imageUrl
            ? `${baseImageURL}${params.row.imageUrl}`
            : '';

          return image ? (
            <Box
              component="img"
              src={image}
              alt={params.row.title}
              sx={{
                width: 56,
                height: 56,
                objectFit: 'cover',
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                mt: 0.5,
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No image
            </Typography>
          );
        },
      },
      {
        field: 'pdfUrl',
        headerName: 'PDF',
        width: 130,
        sortable: false,
        renderCell: (params) => {
          const pdf = params.row.pdfUrl
            ? `${baseImageURL}${params.row.pdfUrl}`
            : '';

          return pdf ? (
            <Button
              size="small"
              variant="text"
              startIcon={<PictureAsPdfIcon />}
              href={pdf}
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No PDF
            </Typography>
          );
        },
      },
      {
        field: 'title',
        headerName: 'Title',
        flex: 1,
        minWidth: 220,
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 120,
        renderCell: (params) =>
          params.row.isActive ? (
            <Chip label="Active" color="success" size="small" />
          ) : (
            <Chip label="Inactive" size="small" />
          ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <Stack direction="row" spacing={0.5}>
              <IconButton
                color="primary"
                onClick={() => handleOpenEdit(params.row)}
                disabled={deleteLoadingId === params.row.promotionId}
              >
                <EditIcon />
              </IconButton>

              <IconButton
                color="error"
                onClick={() => handleDeleteClick(params.row)}
                disabled={deleteLoadingId === params.row.promotionId}
              >
                {deleteLoadingId === params.row.promotionId ? (
                  <CircularProgress size={18} />
                ) : (
                  <DeleteIcon />
                )}
              </IconButton>
            </Stack>
          </Box>
        ),
      },
    ],
    [deleteLoadingId]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            mb={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Seasonal Promotions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage seasonal promotions, preview images, and PDF attachments
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={tableLoading}
            >
              Add Promotion
            </Button>
          </Stack>

          <Paper sx={{ height: 560, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={tableLoading}
              getRowId={(row) => row.promotionId}
              disableRowSelectionOnClick
              rowHeight={72}
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                },
              }}
            />
          </Paper>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {editingId ? 'Update Seasonal Promotion' : 'Create Seasonal Promotion'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
	              fullWidth
	              required
	              disabled={submitLoading}
	              error={submitAttempted && formErrors.title}
	              helperText={submitAttempted && formErrors.title ? 'Required' : ''}
	            />

            <TextField
              label="Short Description"
              value={form.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              fullWidth
              multiline
	              minRows={2}
	              disabled={submitLoading}
	              required
	              error={submitAttempted && formErrors.shortDescription}
	              helperText={submitAttempted && formErrors.shortDescription ? 'Required' : ''}
	            />

            <TextField
              label="Full Description"
              value={form.fullDescription}
              onChange={(e) => handleChange('fullDescription', e.target.value)}
              fullWidth
              multiline
	              minRows={4}
	              disabled={submitLoading}
	              required
	              error={submitAttempted && formErrors.fullDescription}
	              helperText={submitAttempted && formErrors.fullDescription ? 'Required' : ''}
	            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start Date"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                fullWidth
	                disabled={submitLoading}
	                InputLabelProps={{ shrink: true }}
	                required
	                error={submitAttempted && formErrors.startDate}
	                helperText={submitAttempted && formErrors.startDate ? 'Required' : ''}
	              />

              <TextField
                label="End Date"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                fullWidth
	                disabled={submitLoading}
	                InputLabelProps={{ shrink: true }}
	                required
	                error={submitAttempted && formErrors.endDate}
	                helperText={submitAttempted && formErrors.endDate ? 'Required' : ''}
	              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                disabled={submitLoading}
              />
              <Typography>Active</Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
            >
              <Stack spacing={1.5} sx={{ flex: 1 }}>
	                <Typography variant="subtitle2">
	                  Preview Image <Box component="span" sx={{ color: 'error.main' }}>*</Box>
	                </Typography>

                <Button variant="outlined" component="label" disabled={submitLoading}>
                  Upload Image
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                </Button>

                {imagePreview ? (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      width: 220,
                      height: 140,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #ddd',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 220,
                      height: 140,
                      borderRadius: 2,
                      border: '1px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                      fontSize: 14,
                    }}
                  >
                    No image selected
                  </Box>
	                )}
	                {submitAttempted && formErrors.imageUrl && (
	                  <Typography variant="caption" color="error">
	                    Required
	                  </Typography>
	                )}
	              </Stack>

              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Typography variant="subtitle2">PDF File</Typography>

                <Button
                  variant="outlined"
                  component="label"
                  disabled={submitLoading}
                  startIcon={<PictureAsPdfIcon />}
                >
                  Upload PDF
                  <input
                    hidden
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                  />
                </Button>

                {form.pdfUrl ? (
                  <Typography variant="body2" color="text.secondary">
                    Selected PDF: {form.pdfUrl.name}
                  </Typography>
                ) : existingPdfUrl ? (
                  <Button
                    variant="text"
                    href={existingPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ justifyContent: 'flex-start', px: 0 }}
                  >
                    View current PDF
                  </Button>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No PDF selected
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitLoading}>
            Cancel
          </Button>

	          <Button variant="contained" onClick={handleSubmit} disabled={submitLoading || !isFormValid}>
            {submitLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : editingId ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <CommonAlertDialog
        open={alertDialog.open}
        title={alertDialog.title}
        message={alertDialog.message}
        color={alertDialog.color}
        onClose={() =>
          setAlertDialog({
            open: false,
            title: '',
            message: '',
            color: 'primary',
          })
        }
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        setOpen={(val) => setDeleteDialog({ open: val, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        memberName={deleteDialog.name}
      />
    </Box>
  );
};

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
