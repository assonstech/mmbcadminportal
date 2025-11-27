import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardMedia,
    CardContent,
    Avatar,
    Snackbar,
    Alert,
    Tooltip,
} from "@mui/material";
import { AddCircleOutline, Edit, Close, DeleteOutline } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import {
    getAllKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
} from "../controllers/KnowledgeController";
import { deleteImage, sendNotification } from "../controllers/MemberController";
import api, { baseImageURL } from "../config/api";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";

const emptyForm = {
    id: "",
    content: "",
    image: null,
    createdBy: "",
    createdAt: "",
};

const KnowledgeSharingPage = () => {
    const [knowledgeList, setKnowledgeList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [previousImage, setPreviousImage] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [validationErrors, setValidationErrors] = useState([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewDetail, setViewDetail] = useState(null);

    // 🔹 Fetch Knowledge List
    const fetchKnowledge = useCallback(async (setLoadingName) => {
        try {
            setLoadingName(true);
            const res = await getAllKnowledge();
            if (res.success) {
                const data = res.data.map((k) => ({
                    ...k,
                    image: k.image ? baseImageURL + k.image : null,
                    createdBy: k.createdBy || "Unknown",
                }));
                setKnowledgeList(data);
            }
        } catch (err) {
            console.error("Error fetching knowledge:", err);
        } finally {
            setLoadingName(false);
        }
    }, []);

    useEffect(() => {
        fetchKnowledge(setLoading);
    }, [fetchKnowledge]);

    // 🔹 Handle Image Upload
    const handleUpload = async (file) => {
        if (!(file instanceof File)) return null;
        try {
            const formData = new FormData();
            formData.append("postImage", file);

            const res = await api.post("/single-upload/postImage", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.success ? res.data.postImage : null;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    // 🔹 Image Preview
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        setForm((f) => ({ ...f, image: file || null }));

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };

    // 🔹 Form Validation
    const validateForm = useCallback(() => {
        const errors = [];

        // Created By is required
        if (!form.createdBy?.trim()) errors.push("createdBy");

        // Either content or image must exist
        if (!form.content?.trim() && !form.image) errors.push("contentOrImage");

        setValidationErrors(errors);

        // Valid if no errors
        return errors.length === 0;
    }, [form]);


    // 🔹 Save Knowledge
    const handleSave = async () => {

        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Please fill all required fields",
                severity: "warning",
            });
            return;
        }

        try {
            setActionLoading(true);

            let finalImage = form.image;
            if (form.image instanceof File) {
                const uploadedFile = await handleUpload(form.image);
                if (uploadedFile) {
                    finalImage = uploadedFile;
                    if (previousImage) await deleteImage(previousImage);
                }
            }

            const payload = { ...form, image: finalImage };
            const res = editing
                ? await updateKnowledge(form.id, payload)
                : await createKnowledge(payload);

            if (res.success) {
                if (!editing) {
                    await sendNotification(
                        "New HR Working Post",
                        `A new post has been shared by "${form?.createdBy}": "${form?.content.slice(0, 50)}..."`
                    );
                }
                await fetchKnowledge(setActionLoading);
                handleClose();
                setSnackbar({
                    open: true,
                    message: editing ? "Knowledge updated successfully" : "Knowledge created successfully",
                    severity: "success",
                });
            }
        } catch (err) {
            console.error("Error saving knowledge:", err);
            setSnackbar({ open: true, message: "Error saving knowledge", severity: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    // 🔹 Delete Logic
    const handleDeleteConfirm = async () => {
        if (!selectedToDelete) return;
        try {
            setActionLoading(true);
            const res = await deleteKnowledge(selectedToDelete.id);
            if (res.success) {
                setSnackbar({
                    open: true,
                    message: "Knowledge deleted successfully",
                    severity: "success",
                });
                await fetchKnowledge(setActionLoading);
                if (selectedToDelete.image) {
                    const filename = selectedToDelete.image.replace(baseImageURL, "");
                    await deleteImage(filename);
                }
            }
        } catch (err) {
            console.error("Error deleting knowledge:", err);
            setSnackbar({ open: true, message: "Error deleting knowledge", severity: "error" });
        } finally {
            setActionLoading(false);
            setDeleteOpen(false);
            setSelectedToDelete(null);
        }
    };

    // 🔹 Edit / Create / Close
    const handleEdit = (k) => {
        const filename = k.image ? k.image.replace(baseImageURL, "") : null;
        setForm({ ...k, image: filename });
        setPreviewImage(k.image || null);
        setPreviousImage(filename);
        setEditing(true);
        setOpenModal(true);
    };

    const handleCreate = () => {
        setForm(emptyForm);
        setPreviewImage(null);
        setValidationErrors([]);
        setEditing(false);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setValidationErrors([]);
    };

    // 🔹 Search Filter
    const filteredKnowledge = useMemo(
        () =>
            knowledgeList.filter(
                (k) =>
                    k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    k.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [knowledgeList, searchTerm]
    );

    // 🔹 UI Rendering
    return (
        <Box sx={{ p: 3, position: "relative" }}>
            {actionLoading && !openModal && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: "rgba(255,255,255,0.6)",
                        zIndex: 10,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}

            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, top: 0, zIndex: 1000, mb: 5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Working Group Sharing
                    </Typography>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        sx={{ minWidth: 400 }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={handleCreate}
                >
                    Add Post
                </Button>
            </Box>

            {/* Cards */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 3,
                }}
            >
                {loading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                        <Card
                            key={idx}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                height: 320,
                                "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                                transition: "0.3s",
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", p: 1, gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "#e0e0e0" }} />
                                <Box sx={{ flexGrow: 1, height: 24, bgcolor: "#e0e0e0", borderRadius: 1 }} />
                            </Box>
                            <Box sx={{ height: 180, bgcolor: "#e0e0e0" }} />
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "90%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "80%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "60%" }} />
                            </CardContent>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 1, borderTop: "1px solid #eee" }}>
                                <Box sx={{ width: 24, height: 24, bgcolor: "#e0e0e0", borderRadius: "50%" }} />
                                <Box sx={{ width: 24, height: 24, bgcolor: "#e0e0e0", borderRadius: "50%" }} />
                            </Box>
                        </Card>
                    ))
                ) : filteredKnowledge.length ? (
                    filteredKnowledge.map((k) => (
                        <Card
                            key={k.id}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                transition: "0.3s",
                                "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                                cursor: "pointer",
                                minHeight: 220,
                            }}
                            onClick={() => setViewDetail(k)}
                        >
                            {/* Header */}
                            <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
                                <Avatar>{k.createdBy?.[0] || "U"}</Avatar>
                                <Box sx={{ ml: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {k.createdBy}
                                    </Typography>
                                    {k.createdAt && (
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Image */}
                            {k.image && (
                                <CardMedia
                                    component="img"
                                    image={k.image}
                                    alt={k.content}
                                    sx={{
                                        width: "100%",
                                        height: 180,
                                        objectFit: "fill",
                                        objectPosition: "center",
                                    }}
                                />
                            )}

                            {/* Content */}
                            {k.content && (
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">
                                        {k.content.length > 100 ? `${k.content.slice(0, 100)}...` : k.content}
                                    </Typography>
                                </CardContent>
                            )}

                            {/* Footer fixed at bottom */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    p: 1,
                                    borderTop: "1px solid #eee",
                                    mt: "auto", // ensures footer stays at bottom
                                }}
                            >
                                <Tooltip title="Edit">
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); handleEdit(k); }}
                                        size="small"
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); setSelectedToDelete(k); setDeleteOpen(true); }}
                                        size="small"
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Card>
                    ))



                ) : (
                    <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                            gridColumn: "1 / -1",
                            textAlign: "center",
                            height: "60vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        No knowledge posts found
                    </Typography>
                )}
            </Box>

            {/* Add/Edit Modal */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ position: "relative" }}>
                    {editing ? "Edit Knowledge" : "Add Knowledge"}
                    <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ position: "relative" }}>
                    {actionLoading && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                bgcolor: "rgba(255,255,255,0.7)",
                                zIndex: 10,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 1,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Content"
                            multiline
                            minRows={3}
                            value={form.content}
                            error={validationErrors.includes("content")}
                            helperText={validationErrors.includes("content") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                        />
                        <TextField
                            label="Created By"
                            value={form.createdBy}
                            error={validationErrors.includes("createdBy")}
                            helperText={validationErrors.includes("createdBy") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, createdBy: e.target.value }))}
                        />
                        <Box>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {validationErrors.includes("contentOrImage") && (
                                <Typography color="error" variant="caption">
                                    Please include either content or an image
                                </Typography>
                            )}

                            {previewImage && (
                                <Box
                                    component="img"
                                    src={previewImage}
                                    alt="Preview"
                                    sx={{
                                        width: "100%",
                                        maxHeight: 200,
                                        objectFit: "cover",
                                        borderRadius: 2,
                                        mt: 1,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
                        {editing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Detail Modal */}
            <Dialog open={!!viewDetail} onClose={() => setViewDetail(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {viewDetail?.createdBy}
                    <IconButton onClick={() => setViewDetail(null)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {viewDetail?.image && (
                        <Box
                            component="img"
                            src={viewDetail.image}
                            alt={viewDetail.content}
                            sx={{ width: "100%", borderRadius: 2, mb: 2 }}
                        />
                    )}
                    <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                        {viewDetail?.content}
                    </Typography>
                </DialogContent>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>

            {/* Delete Confirm Dialog */}
            <DeleteConfirmDialog
                open={deleteOpen}
                setOpen={setDeleteOpen}
                memberName={"this content"}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default KnowledgeSharingPage;
