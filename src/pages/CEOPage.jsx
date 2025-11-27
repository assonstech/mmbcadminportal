import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Stack, TextField, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem, Select, FormControl, Skeleton
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import api, { baseImageURL } from '../config/api';
import { deleteImage, getECMembers, getMembers } from '../controllers/MemberController';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function CEOPage() {
    const [orgData, setOrgData] = useState({ memberId: '', noteMessage: '', Secretaries: [] });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // CEO Form states
    const [ceoForm, setCeoForm] = useState({ memberId: '', noteMessage: '' });
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [confirmNoteOpen, setConfirmNoteOpen] = useState(false);
    const [isEditingCEO, setIsEditingCEO] = useState(false);
    const [confirmCEOOpen, setConfirmCEOOpen] = useState(false);

    // Secretaries
    const [secForm, setSecForm] = useState({ name: '', phone: '', email: '', photoPath: '', photoFile: null, photoPreview: '' });
    const [secDialogOpen, setSecDialogOpen] = useState(false);
    const [editSecIndex, setEditSecIndex] = useState(null);
    const [ceoImageLoading, setCeoImageLoading] = useState(true);
    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);


    const ceoMember = members.find(m => m.memberId === (isEditingCEO ? ceoForm.memberId : orgData.memberId));

    useEffect(() => {
        fetchOrgData();
        fetchMembers();
    }, []);

    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("secImage", file);
            const res = await api.post(`/single-upload/secImage`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.success ? res.data.secImage : null;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    const fetchOrgData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/ceo-data');
            setOrgData(res.data);
            setCeoForm({ memberId: res.data.memberId, noteMessage: res.data.noteMessage });
            setNoteInput(res.data.noteMessage || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        const data = await getECMembers();
        setMembers(data);
    };

    /** ---------- CEO Note ---------- **/
    const handleNoteEdit = () => setIsEditingNote(true);
    const handleNoteCancel = () => {
        setNoteInput(orgData.noteMessage);
        setIsEditingNote(false);
    };
    const handleNoteSave = () => setConfirmNoteOpen(true);

    const confirmNoteSave = async () => {
        try {
            setLoading(true);
            setConfirmNoteOpen(false);
            await api.put('/ceo-data/noteMessage', { noteMessage: noteInput });
            setSnackbar({ open: true, message: 'Note message updated!', severity: 'success' });
            fetchOrgData();
            setIsEditingNote(false);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to update note message', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    /** ---------- CEO Member ---------- **/
    const handleCEOEdit = () => setIsEditingCEO(true);
    const handleCEOCancel = () => {
        setCeoForm(f => ({ ...f, memberId: orgData.memberId }));
        setIsEditingCEO(false);
    };
    const handleCEOSave = () => setConfirmCEOOpen(true);

    const confirmCEOSave = async () => {
        try {
            setLoading(true);
            setConfirmCEOOpen(false);
            await api.put('/ceo-data/memberId', { memberId: ceoForm.memberId });
            setOrgData(prev => ({ ...prev, memberId: ceoForm.memberId }));
            setSnackbar({ open: true, message: 'CEO member updated!', severity: 'success' });
            fetchOrgData();
            setIsEditingCEO(false);
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to update CEO', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    /** ---------- Secretaries ---------- **/
    const handleSecSave = async () => {
        try {
            // --- Validation ---
            if (!secForm.name.trim()) {
                setSnackbar({ open: true, message: "Name is required", severity: "error" });
                return;
            }
            if (!secForm.phone.trim()) {
                setSnackbar({ open: true, message: "Phone is required", severity: "error" });
                return;
            }
            if (!secForm.email.trim()) {
                setSnackbar({ open: true, message: "Email is required", severity: "error" });
                return;
            }
            // For new secretaries, photo is required
            if (editSecIndex === null && !secForm.photoFile) {
                setSnackbar({ open: true, message: "Photo is required", severity: "error" });
                return;
            }

            setLoading(true);

            let finalImage = secForm.photoPath;
            const previousImage = editSecIndex !== null ? orgData.Secretaries[editSecIndex]?.photoPath : null;

            // Upload only if new file selected
            if (secForm.photoFile instanceof File) {
                const uploadedFileName = await handleUpload(secForm.photoFile);
                if (!uploadedFileName) throw new Error("Image upload failed");

                finalImage = uploadedFileName;

                // Delete previous image only when editing
                if (editSecIndex !== null && previousImage) {
                    try {
                        await deleteImage(previousImage);
                    } catch (err) {
                        console.warn("Failed to delete previous image, continuing...", err);
                    }
                }

                setSecForm(f => ({
                    ...f,
                    photoPath: finalImage,
                    photoPreview: `${baseImageURL}/${uploadedFileName}?t=${Date.now()}`,
                }));
            }

            const payload = {
                name: secForm.name,
                phone: secForm.phone,
                email: secForm.email,
                photoPath: finalImage,
            };

            let updatedSecretaries;
            if (editSecIndex !== null) {
                await api.put(`/ceo-data/secretaries/${editSecIndex}`, payload);
                updatedSecretaries = orgData.Secretaries.map((sec, idx) =>
                    idx === editSecIndex ? payload : sec
                );
            } else {
                await api.post("/ceo-data/secretaries", payload);
                updatedSecretaries = [...orgData.Secretaries, payload];
            }

            setOrgData(prev => ({ ...prev, Secretaries: updatedSecretaries }));

            setSecDialogOpen(false);
            setSecForm({ name: '', phone: '', email: '', photoPath: '', photoFile: null, photoPreview: '' });
            setEditSecIndex(null);

            setSnackbar({ open: true, message: "Secretary saved successfully!", severity: "success" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: err.message || "Failed to save secretary", severity: "error" });
        } finally {
            setLoading(false);
        }
    };


    const handleSecEdit = (sec, index) => {
        setSecForm({ ...sec, photoPreview: sec.photoPath ? `${baseImageURL}/${sec.photoPath}?t=${Date.now()}` : '' });
        setEditSecIndex(index);
        setSecDialogOpen(true);
    };

    const handleSecDelete = (index) => {
        setDeleteIndex(index);
        setDeleteDialogOpen(true);
    };


    const confirmSecDelete = async () => {
        if (deleteIndex === null) return;
        try {
            setLoading(true);
            const secToDelete = orgData.Secretaries[deleteIndex];

            if (secToDelete.photoPath) {
                await deleteImage(secToDelete.photoPath);
            }

            await api.delete(`/ceo-data/secretaries/${deleteIndex}`);

            setOrgData(prev => ({
                ...prev,
                Secretaries: prev.Secretaries.filter((_, i) => i !== deleteIndex),
            }));

            setSnackbar({ open: true, message: "Secretary deleted!", severity: "success" });
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: "Failed to delete secretary", severity: "error" });
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setDeleteIndex(null);
        }
    };


    return (
        <Box sx={{ position: 'relative', p: 3 }}>
            {/* Loading Overlay */}
            {loading && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: "rgba(255,255,255,0.7)",
                        zIndex: 2000, // higher than MUI Dialog (1300)
                    }}
                >
                    <CircularProgress size={60} thickness={4} />
                </Box>
            )}


            {/* CEO Info Section */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 4, mb: 4, p: 4, borderRadius: 3, background: "linear-gradient(135deg, #f9fafc 0%, #ffffff 100%)", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", border: "1px solid #eaeaea", flexWrap: "wrap" }}>
                {/* CEO Photo */}
                <Box sx={{ width: 120, height: 120, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid #1976d2", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ceoImageLoading && <CircularProgress size={40} />}
                    <img
                        src={ceoMember?.companyOrIndividualImage ? `${baseImageURL}/${ceoMember.companyOrIndividualImage}?t=${Date.now()}` : "/default-avatar.webp"}
                        style={{ width: "100%", height: "100%", objectFit: "inherit", display: ceoImageLoading ? "none" : "block" }}
                        onLoad={() => setCeoImageLoading(false)}
                        onError={() => setCeoImageLoading(false)}
                    />
                </Box>

                {/* CEO Info + Note */}
                <Box sx={{ flex: 1, minWidth: "300px" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                            {loading || !ceoMember ? <Skeleton variant="text" width={200} height={32} /> :
                                <Typography variant="h5" sx={{ fontWeight: "bold" }}>{ceoMember.representiveName}</Typography>}
                            {loading || !ceoMember ? <Skeleton variant="text" width={150} height={20} sx={{ mt: 0.5 }} /> :
                                ceoMember.representivePosition && <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{ceoMember.representivePosition}</Typography>}
                        </Box>
                        {/* {!isEditingCEO && !loading && <Typography variant="body2" sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }} onClick={handleCEOEdit}>Update CEO</Typography>} */}
                    </Stack>

                    {isEditingCEO && (
                        <Stack direction="row" spacing={2} alignItems="center" mt={1}>
                            <FormControl sx={{ minWidth: 240 }}>
                                <Select value={ceoForm.memberId || ""} onChange={e => setCeoForm(f => ({ ...f, memberId: e.target.value }))}>
                                    {members.map(m => <MenuItem key={m.memberId} value={m.memberId}>{m.representiveName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={handleCEOSave}>Save</Button>
                            <Button variant="text" onClick={handleCEOCancel}>Cancel</Button>
                        </Stack>
                    )}

                    {/* CEO Note */}
                    <Box mt={3}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>CEO Message</Typography>
                            {!isEditingNote && <Typography variant="body2" sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }} onClick={handleNoteEdit}>Update Note</Typography>}
                        </Stack>
                        {!isEditingNote ? (
                            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.7, whiteSpace: "pre-wrap", backgroundColor: "#f6f8fa", p: 2, borderRadius: 2 }}>
                                {orgData?.noteMessage || "No note message added yet."}
                            </Typography>
                        ) : (
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <TextField fullWidth multiline minRows={3} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} />
                                <Button variant="contained" onClick={handleNoteSave}>Save</Button>
                                <Button variant="text" onClick={handleNoteCancel}>Cancel</Button>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Secretaries Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Secretaries</Typography>

                    {orgData.Secretaries.length < 3 && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setSecForm({
                                    name: '',
                                    phone: '',
                                    email: '',
                                    photoPath: '',
                                    photoFile: null,
                                    photoPreview: ''
                                });
                                setEditSecIndex(null);
                                setSecDialogOpen(true);
                            }}
                        >
                            Add Secretary
                        </Button>
                    )}
                </Stack>


                <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={orgData.Secretaries.map((sec, idx) => ({ id: idx, ...sec }))}
                        columns={[
                            { field: 'name', headerName: 'Name', flex: 1 },
                            { field: 'phone', headerName: 'Phone', flex: 1 },
                            { field: 'email', headerName: 'Email', flex: 1 },
                            {
                                field: 'actions',
                                type: 'actions',
                                headerName: 'Actions',
                                flex: 0.5,
                                getActions: (params) => [
                                    <GridActionsCellItem icon={<Edit />} label="Edit" onClick={() => handleSecEdit(params.row, params.id)} />,
                                    <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => handleSecDelete(params.id)} />,
                                ],
                            },
                        ]}
                        pageSize={5}
                        rowsPerPageOptions={[]}
                        autoHeight
                        disableSelectionOnClick
                        loading={loading}
                        hideFooterPagination={true}
                    />
                </Box>
            </Paper>

            {/* Secretaries Dialog */}
            <Dialog open={secDialogOpen} onClose={() => setSecDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", fontSize: 20, textAlign: "center" }}>{editSecIndex !== null ? 'Edit Secretary' : 'Add New Secretary'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Name"
                            fullWidth
                            value={secForm.name}
                            onChange={e => setSecForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <TextField
                            label="Phone"
                            fullWidth
                            value={secForm.phone}
                            onChange={e => setSecForm(f => ({ ...f, phone: e.target.value }))}
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={secForm.email}
                            onChange={e => setSecForm(f => ({ ...f, email: e.target.value }))}
                        />


                        {/* Image Upload */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Box
                                sx={{
                                    width: 150,
                                    height: 120,
                                    border: "2px dashed #1976d2",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "&:hover .overlay": { opacity: editSecIndex !== null ? 1 : 0 }, // overlay only in edit mode
                                    backgroundColor: "#f5f5f5",
                                }}
                                onClick={() => document.getElementById("sec-photo-input").click()}
                            >
                                {secForm.photoPreview ? (
                                    <img
                                        src={secForm.photoPreview}
                                        alt="Secretary"
                                        style={{ width: "100%", height: "100%", objectFit: "fit" }}
                                    />
                                ) : (
                                    <Typography variant="caption" sx={{ textAlign: "center", color: "#1976d2" }}>Upload</Typography>
                                )}

                                {editSecIndex !== null && (
                                    <Box className="overlay" sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                        opacity: 0,
                                        transition: "opacity 0.2s",
                                    }}>
                                        Change
                                    </Box>
                                )}
                            </Box>

                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                id="sec-photo-input"
                                onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setSecForm(f => ({ ...f, photoFile: file }));
                                        const reader = new FileReader();
                                        reader.onload = ev => setSecForm(f => ({ ...f, photoPreview: ev.target.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />


                        </Box>




                    </Stack>

                </DialogContent>
                <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
                    <Button variant="outlined" color="inherit" onClick={() => setSecDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSecSave}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Dialogs */}
            <Dialog open={confirmNoteOpen} onClose={() => setConfirmNoteOpen(false)}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>Are you sure you want to update the note message?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmNoteOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={confirmNoteSave}>Yes, Update</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmCEOOpen} onClose={() => setConfirmCEOOpen(false)}>
                <DialogTitle>Confirm Update</DialogTitle>
                <DialogContent>Are you sure you want to update the CEO member?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmCEOOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={confirmCEOSave}>Yes, Update</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
            <DeleteConfirmDialog
                open={deleteDialogOpen}
                setOpen={setDeleteDialogOpen}
                onConfirm={confirmSecDelete}
                memberName={deleteIndex !== null ? orgData.Secretaries[deleteIndex].name : ''}
            />

        </Box>
    );

}