import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { baseImageURL } from '../config/api';
import {
  createNewsletter,
  deleteNewsletter,
  getAdminNewsletters,
  updateNewsletter,
  removeNewsletterPdf,
} from '../controllers/NewsLetterController';
import { sendNotification } from '../controllers/MemberController';
import { createNotification, getCreatedReferenceId } from '../controllers/NotificationController';
import CommonAlertDialog from '../components/CommonAlertDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const initialForm = {
  title: '',
  fullDescription: '',
  readMinutes: '',
  publishedAt: '',
  imageUrl: null,
  pdfUrl: null,
};

export default function NewsLetterPage() {
  const [rows, setRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [removePdfLoading, setRemovePdfLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 1,
  });

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

  const [removePdfDialog, setRemovePdfDialog] = useState({
    open: false,
    name: '',
  });

  const fetchNewsletters = async (currentPage = page, currentSearch = search) => {
    setTableLoading(true);
    try {
      const res = await getAdminNewsletters(currentPage, pageSize, currentSearch);

      if (res?.success) {
        setRows(res.data || []);
        setPagination(
          res.pagination || {
            page: currentPage,
            pageSize,
            totalCount: 0,
            totalPages: 1,
          }
        );
      } else {
        setRows([]);
        setPagination({
          page: currentPage,
          pageSize,
          totalCount: 0,
          totalPages: 1,
        });
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Failed to fetch newsletters',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Failed to fetch newsletters:', err);
      setRows([]);
      setPagination({
        page: currentPage,
        pageSize,
        totalCount: 0,
        totalPages: 1,
      });
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to fetch newsletters',
        color: 'error',
      });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsletters(page, search);
  }, [page, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setImagePreview('');
    setExistingPdfUrl('');
    setSubmitAttempted(false);
  };

  const formErrors = {
    title: !form.title.trim(),
    fullDescription: !form.fullDescription.trim(),
    readMinutes: !form.readMinutes.toString().trim() || Number(form.readMinutes) <= 0,
    publishedAt: !form.publishedAt,
    imageUrl: !imagePreview,
  };

  const isFormValid = !Object.values(formErrors).some(Boolean);

  const handleCloseDialog = () => {
    if (submitLoading || removePdfLoading) return;
    setOpenDialog(false);
    resetForm();
    setRemovePdfDialog({ open: false, name: '' });
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = (row) => {
    setEditingId(row.newsletterId);
    setForm({
      title: row.title || '',
      fullDescription: row.fullDescription || '',
      readMinutes: row.readMinutes || '',
      publishedAt: formatDateTimeLocal(row.publishedAt),
      imageUrl: null,
      pdfUrl: null,
    });
    setImagePreview(row.imageUrl ? `${baseImageURL}${row.imageUrl}` : '');
    setExistingPdfUrl(row.pdfUrl ? `${baseImageURL}${row.pdfUrl}` : '');
    setSubmitAttempted(false);
    setOpenDialog(true);
  };

  const handleChange = (field, value) => {
    if (field === 'title' && value.length > 255) return;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, imageUrl: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, pdfUrl: file }));
  };

  const handleRemoveSelectedPdf = () => {
    setForm((prev) => ({ ...prev, pdfUrl: null }));
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
        publishedAt: form.publishedAt || '',
        readMinutes: form.readMinutes || '',
      };

      const res = editingId
        ? await updateNewsletter(editingId, payload)
        : await createNewsletter(payload);

      if (res?.success) {
        if (!editingId) {
          await sendNotification(
            'New Newsletter',
            `"${form.title}" is now available.`
          );
          await createNotification({
            title: form.title,
            description: form.fullDescription,
            type: 'NEWSLETTER',
            referenceId: getCreatedReferenceId(res, ['newsletterId']),
          });
        }

        setOpenDialog(false);
        resetForm();
        await fetchNewsletters(page, search);

        setAlertDialog({
          open: true,
          title: 'Success',
          message: editingId
            ? 'Newsletter updated successfully'
            : 'Newsletter created successfully',
          color: 'success',
        });
      } else {
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Failed to save newsletter',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Save newsletter error:', err);
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to save newsletter',
        color: 'error',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteDialog({
      open: true,
      id: row.newsletterId,
      name: row.title || 'this newsletter',
    });
  };

  const handleConfirmDelete = async () => {
    const id = deleteDialog.id;
    if (!id) return;

    setDeleteLoadingId(id);

    try {
      const res = await deleteNewsletter(id);

      if (res?.success) {
        const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;

        if (nextPage !== page) {
          setPage(nextPage);
        } else {
          await fetchNewsletters(page, search);
        }

        setAlertDialog({
          open: true,
          title: 'Success',
          message: 'Newsletter deleted successfully',
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
      console.error('Delete newsletter error:', err);
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

  const handleAskRemovePdf = () => {
    if (!editingId || !existingPdfUrl) return;
    setRemovePdfDialog({
      open: true,
      name: form.title || 'this newsletter',
    });
  };

  const handleConfirmRemovePdf = async () => {
    if (!editingId) return;

    setRemovePdfLoading(true);

    try {
      const res = await removeNewsletterPdf(editingId);

      if (res?.success) {
        setExistingPdfUrl('');
        setForm((prev) => ({ ...prev, pdfUrl: null }));
        await fetchNewsletters(page, search);

        setAlertDialog({
          open: true,
          title: 'Success',
          message: 'File removed successfully',
          color: 'success',
        });
      } else {
        setAlertDialog({
          open: true,
          title: 'Error',
          message: res?.message || 'Failed to remove file',
          color: 'error',
        });
      }
    } catch (err) {
      console.error('Remove file error:', err);
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Failed to remove file',
        color: 'error',
      });
    } finally {
      setRemovePdfLoading(false);
      setRemovePdfDialog({ open: false, name: '' });
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

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={2.5} mb={3}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Newsletters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage newsletters, preview images, and file attachments
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                disabled={tableLoading}
              >
                Add Newsletter
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Search newsletters"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                fullWidth
                size="small"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button variant="contained" onClick={handleSearch}>
                Search
              </Button>
              <Button variant="outlined" onClick={handleResetSearch}>
                Reset
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Total: {pagination.totalCount} newsletters
            </Typography>
          </Stack>

          {tableLoading ? (
            <Box
              sx={{
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" mb={1}>
                No newsletters found
              </Typography>
              <Typography variant="body2">
                Try a different search or create a new newsletter.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {rows.map((item) => {
                const imageUrl = item.imageUrl ? `${baseImageURL}${item.imageUrl}` : '';
                const fileUrl = item.pdfUrl ? `${baseImageURL}${item.pdfUrl}` : '';

                return (
                  <Paper
                    key={item.newsletterId}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ xs: 'stretch', md: 'center' }}
                    >
                      <Box
                        sx={{
                          width: { xs: '100%', md: 220 },
                          minWidth: { xs: '100%', md: 220 },
                          height: { xs: 180, md: 180 },
                          bgcolor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRight: { md: '1px solid #e5e7eb' },
                        }}
                      >
                        {imageUrl ? (
                          <Box
                            component="img"
                            src={imageUrl}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No image
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ flex: 1, p: 2.5 }}>
                        <Stack spacing={1.2}>
                          <Typography variant="h6" fontWeight={700}>
                            {item.title}
                          </Typography>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            color="text.secondary"
                          >
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">
                                {item.readMinutes ? `${item.readMinutes} min read` : '-'}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <CalendarMonthIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">
                                {formatDisplayDate(item.publishedAt)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {item.fullDescription || '-'}
                          </Typography>

                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            spacing={1.5}
                            pt={1}
                          >
                            <Box>
                              {fileUrl ? (
                                <Button
                                  size="small"
                                  variant="text"
                                  startIcon={<PictureAsPdfIcon />}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  sx={{ px: 0 }}
                                >
                                  View File
                                </Button>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No file attached
                                </Typography>
                              )}
                            </Box>

                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEdit(item)}
                                disabled={deleteLoadingId === item.newsletterId}
                              >
                                <EditIcon />
                              </IconButton>

                              <IconButton
                                color="error"
                                onClick={() => handleDeleteClick(item)}
                                disabled={deleteLoadingId === item.newsletterId}
                              >
                                {deleteLoadingId === item.newsletterId ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <DeleteIcon />
                                )}
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={tableLoading || page <= 1}
            >
              Previous
            </Button>

            <Typography variant="body2">
              Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
            </Typography>

            <Button
              variant="outlined"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={tableLoading || page >= Math.max(pagination.totalPages || 1, 1)}
            >
              Next
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {editingId ? 'Update Newsletter' : 'Create Newsletter'}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              fullWidth
	              required
	              disabled={submitLoading || removePdfLoading}
	              inputProps={{ maxLength: 255 }}
	              error={submitAttempted && formErrors.title}
	              helperText={submitAttempted && formErrors.title ? 'Required' : `${form.title.length}/255`}
	            />

            <TextField
              label="Full Description"
              value={form.fullDescription}
              onChange={(e) => handleChange('fullDescription', e.target.value)}
              fullWidth
              multiline
	              minRows={6}
	              disabled={submitLoading || removePdfLoading}
	              required
	              error={submitAttempted && formErrors.fullDescription}
	              helperText={submitAttempted && formErrors.fullDescription ? 'Required' : ''}
	            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Read Minutes"
                type="number"
                value={form.readMinutes}
                onChange={(e) => handleChange('readMinutes', e.target.value)}
                fullWidth
	                disabled={submitLoading || removePdfLoading}
	                inputProps={{ min: 1 }}
	                required
	                error={submitAttempted && formErrors.readMinutes}
	                helperText={submitAttempted && formErrors.readMinutes ? 'Required' : ''}
	              />

              <TextField
                label="Published At"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => handleChange('publishedAt', e.target.value)}
                fullWidth
	                disabled={submitLoading || removePdfLoading}
	                InputLabelProps={{ shrink: true }}
	                required
	                error={submitAttempted && formErrors.publishedAt}
	                helperText={submitAttempted && formErrors.publishedAt ? 'Required' : ''}
	              />
            </Stack>

            <Divider />

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
            >
              <Stack spacing={1.5} sx={{ flex: 1 }}>
	                <Typography variant="subtitle2">
	                  Preview Image <Box component="span" sx={{ color: 'error.main' }}>*</Box>
	                </Typography>

                <Button
                  variant="outlined"
                  component="label"
                  disabled={submitLoading || removePdfLoading}
                >
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
                <Typography variant="subtitle2">File (PDF / Word)</Typography>

                <Button
                  variant="outlined"
                  component="label"
                  disabled={submitLoading || removePdfLoading}
                  startIcon={<PictureAsPdfIcon />}
                >
                  Upload File (PDF / Word)
                  <input
                    hidden
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handlePdfChange}
                  />
                </Button>

                {editingId && form.pdfUrl ? (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Selected: {form.pdfUrl.name}
                    </Typography>

                    <Button
                      size="small"
                      color="error"
                      onClick={handleRemoveSelectedPdf}
	            disabled={submitLoading || removePdfLoading || !isFormValid}
	          >
                      Remove
                    </Button>
                  </Stack>
                ) : editingId && existingPdfUrl ? (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Button
                      variant="text"
                      href={existingPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ px: 0 }}
                    >
                      View File
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      onClick={handleAskRemovePdf}
                      disabled={submitLoading || removePdfLoading}
                    >
                      Remove
                    </Button>
                  </Stack>
                ) : form.pdfUrl ? (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      Selected: {form.pdfUrl.name}
                    </Typography>

                    <Button
                      size="small"
                      color="error"
                      onClick={handleRemoveSelectedPdf}
                      disabled={submitLoading || removePdfLoading}
                    >
                      Remove
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No file selected
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitLoading || removePdfLoading}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitLoading || removePdfLoading}
          >
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

      <DeleteConfirmDialog
        open={removePdfDialog.open}
        setOpen={(val) => setRemovePdfDialog({ open: val, name: '' })}
        onConfirm={handleConfirmRemovePdf}
        memberName={`${removePdfDialog.name} file`}
      />
    </Box>
  );
}

function formatDisplayDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
