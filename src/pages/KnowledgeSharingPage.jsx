import React, { useState, useEffect, useCallback } from "react";
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
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Link,
} from "@mui/material";
import { AddCircleOutline, Edit, Close, DeleteOutline } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import {
    getAllKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    removeKnowledgePdf,
} from "../controllers/KnowledgeController";
import { sendNotification } from "../controllers/MemberController";
import { createNotification, getCreatedReferenceId } from "../controllers/NotificationController";
import { baseImageURL } from "../config/api";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";

const emptyForm = {
    id: "",
    content: "",
    image: null,
    pdfUrl: null,
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
    const [selectedPdfName, setSelectedPdfName] = useState("");
    const [existingPdfUrl, setExistingPdfUrl] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [validationErrors, setValidationErrors] = useState([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
    });
    const [viewDetail, setViewDetail] = useState(null);

    // 🔹 Fetch Knowledge List
    const fetchKnowledge = useCallback(async (setLoadingName, currentPage = page, currentLimit = limit, currentSearch = search) => {
        try {
            setLoadingName(true);
            const res = await getAllKnowledge(currentPage, currentLimit, currentSearch);
            if (res.success) {
                const rows = Array.isArray(res.data)
                    ? res.data
                    : res.data?.knowledge || res.data?.posts || res.data?.data || [];
                const paginationData = res.pagination || res.data?.pagination || res.meta || {};
                const totalCount = paginationData.totalCount ?? paginationData.total ?? paginationData.count ?? rows.length;
                const totalPages = paginationData.totalPages
                    ?? paginationData.pages
                    ?? (paginationData.totalCount || paginationData.total
                        ? Math.ceil(totalCount / currentLimit)
                        : rows.length === currentLimit
                            ? currentPage + 1
                            : currentPage);
                const data = rows.map((k) => ({
                    ...k,
                    image: k.image ? baseImageURL + k.image : null,
                    pdfUrl: k.pdfUrl ? baseImageURL + k.pdfUrl : null,
                    createdBy: k.createdBy || "Unknown",
                }));
                setKnowledgeList(data);
                setPagination({
                    page: paginationData.page || currentPage,
                    limit: paginationData.limit || paginationData.pageSize || currentLimit,
                    totalCount,
                    totalPages,
                });
            } else {
                setKnowledgeList([]);
                setPagination({ page: currentPage, limit: currentLimit, totalCount: 0, totalPages: 1 });
            }
        } catch (err) {
            console.error("Error fetching knowledge:", err);
            setKnowledgeList([]);
            setPagination({ page: currentPage, limit: currentLimit, totalCount: 0, totalPages: 1 });
        } finally {
            setLoadingName(false);
        }
    }, [page, limit, search]);

    useEffect(() => {
        fetchKnowledge(setLoading, page, limit, search);
    }, [fetchKnowledge, page, limit, search]);

    const handleSearch = () => {
        setPage(1);
        setSearch(searchInput.trim());
    };

    const handleResetSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
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

    const handlePdfChange = (e) => {
        const file = e.target.files?.[0] || null;
        setForm((f) => ({ ...f, pdfUrl: file }));
        setSelectedPdfName(file?.name || "");
    };

    const handleRemovePdf = async () => {
        if (!form.id) return;

        try {
            setActionLoading(true);
            const res = await removeKnowledgePdf(form.id);
            if (res?.success) {
                setExistingPdfUrl("");
                setSelectedPdfName("");
                setForm((f) => ({ ...f, pdfUrl: null }));
                setSnackbar({ open: true, message: "PDF removed successfully", severity: "success" });
                await fetchKnowledge(setActionLoading, page, limit, search);
            } else {
                setSnackbar({ open: true, message: res?.message || "Failed to remove PDF", severity: "error" });
            }
        } catch (err) {
            console.error("Error removing PDF:", err);
            setSnackbar({ open: true, message: "Failed to remove PDF", severity: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    // 🔹 Form Validation
    const validateForm = useCallback(() => {
        const errors = [];

        // Created By is required
        if (!form.createdBy?.trim()) errors.push("createdBy");

        if (!form.content?.trim()) errors.push("content");

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

            const res = editing
                ? await updateKnowledge(form.id, form)
                : await createKnowledge(form);

            if (res.success) {
                if (!editing) {
                    await sendNotification(
                        "New HR Working Post",
                        `A new post has been shared by "${form?.createdBy}": "${form?.content.slice(0, 50)}..."`
                    );
                    await createNotification({
                        title: "New Working Group Post",
                        description: form.content,
                        type: "KNOWLEDGE",
                        referenceId: getCreatedReferenceId(res, ["knowledgeId"]),
                    });
                }
                await fetchKnowledge(setActionLoading, page, limit, search);
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
                await fetchKnowledge(setActionLoading, page, limit, search);
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
        setForm({ ...k, image: null, pdfUrl: null });
        setPreviewImage(k.image || null);
        setExistingPdfUrl(k.pdfUrl || "");
        setSelectedPdfName(k.pdfUrl ? k.pdfUrl.replace(baseImageURL, "") : "");
        setEditing(true);
        setOpenModal(true);
    };

    const handleCreate = () => {
        setForm(emptyForm);
        setPreviewImage(null);
        setSelectedPdfName("");
        setExistingPdfUrl("");
        setValidationErrors([]);
        setEditing(false);
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
        setValidationErrors([]);
    };

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Typography variant="h5" fontWeight="bold">
                        Working Group Sharing
                    </Typography>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchInput}
                        sx={{ minWidth: 320 }}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                    />
                    <Button variant="outlined" onClick={handleSearch} disabled={loading}>
                        Search
                    </Button>
                    <Button variant="text" onClick={handleResetSearch} disabled={loading || (!searchInput && !search)}>
                        Reset
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <InputLabel id="knowledge-limit-label">Limit</InputLabel>
                        <Select
                            labelId="knowledge-limit-label"
                            value={limit}
                            label="Limit"
                            onChange={(e) => {
                                setPage(1);
                                setLimit(Number(e.target.value));
                            }}
                        >
                            {[5, 10, 20, 50].map((value) => (
                                <MenuItem key={value} value={value}>
                                    {value}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
                ) : knowledgeList.length ? (
                    knowledgeList.map((k) => (
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
                    disabled={loading || page <= 1}
                >
                    Previous
                </Button>

                <Typography variant="body2">
                    Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
                    {" "} | Total: {pagination.totalCount} posts
                </Typography>

                <Button
                    variant="outlined"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading || page >= Math.max(pagination.totalPages || 1, 1)}
                >
                    Next
                </Button>
            </Stack>

            {/* Add/Edit Modal */}
            <Dialog
                open={openModal}
                onClose={actionLoading ? undefined : handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { position: "relative" } }}
            >
                {actionLoading && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(255,255,255,0.72)",
                            zIndex: 20,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
                <DialogTitle sx={{ position: "relative" }}>
                    {editing ? "Edit Knowledge" : "Add Knowledge"}
                    <IconButton
                        onClick={handleClose}
                        disabled={actionLoading}
                        sx={{ position: "absolute", right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
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
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Image
                            </Typography>
                            <input type="file" accept="image/*" onChange={handleImageChange} />

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
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                PDF
                            </Typography>
                            <input type="file" accept="application/pdf" onChange={handlePdfChange} />
                            {selectedPdfName && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {selectedPdfName}
                                </Typography>
                            )}
                            {editing && existingPdfUrl && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                    <Link href={existingPdfUrl} target="_blank" rel="noopener noreferrer">
                                        Current PDF
                                    </Link>
                                    <Button
                                        color="error"
                                        size="small"
                                        variant="outlined"
                                        onClick={handleRemovePdf}
                                        disabled={actionLoading}
                                    >
                                        Remove PDF
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={actionLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={actionLoading}
                        startIcon={actionLoading && <CircularProgress size={18} />}
                    >
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
                    {viewDetail?.pdfUrl && (
                        <Link
                            href={viewDetail.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: "inline-block", mt: 2 }}
                        >
                            View PDF
                        </Link>
                    )}
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
