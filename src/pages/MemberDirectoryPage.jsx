import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import LanguageIcon from "@mui/icons-material/Language";
import PersonIcon from "@mui/icons-material/Person";
import OverlayLoader from "../components/OverlayLoader";
import CommonAlertDialog from "../components/CommonAlertDialog";
import CommonConfirmDialog from "../components/CommonConfirmDialog";
import { baseImageURL } from "../config/api";

import {
  getAllMemberDirectories,
  getMemberDirectoryById, // must add this in controller
  createMemberDirectory,
  updateMemberDirectory,
  deleteMemberDirectory,
} from "../controllers/MemberDirectoryController";

import { getMembers } from "../controllers/MemberController";

const MemberDirectoryPage = () => {
  const [directories, setDirectories] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: "Notice",
    message: "",
    color: "primary",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [hasExistingLogo, setHasExistingLogo] = useState(false);

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    website: "",
    logoUrl: null,
    memberIds: [],
  });

  const showAlert = (message, title = "Notice", color = "primary") => {
    setAlertDialog({ open: true, title, message, color });
  };

  const fetchDirectories = async () => {
    setLoading(true);
    try {
      const res = await getAllMemberDirectories();
      setDirectories(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching directories:", error);
      setDirectories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const result = await getMembers();
      setMembers(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchDirectories();
    fetchMembers();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      subtitle: "",
      description: "",
      website: "",
      logoUrl: null,
      memberIds: [],
    });
    setSubmitAttempted(false);
    setHasExistingLogo(false);
  };

  const formErrors = {
    name: !form.name.trim(),
    subtitle: !form.subtitle.trim(),
    description: !form.description.trim(),
    logoUrl: !(form.logoUrl || (editingId && hasExistingLogo)),
  };

  const isFormValid = !Object.values(formErrors).some(Boolean);

  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = async (row) => {
    setLoading(true);
    try {
      const res = await getMemberDirectoryById(row.id); // detail API call
      const dir = res?.data;

      setEditingId(dir?.id || row.id);
      setForm({
        name: dir?.name || "",
        subtitle: dir?.subtitle || "",
        description: dir?.description || "",
        website: dir?.website || "",
        logoUrl: null,
        memberIds: Array.isArray(dir?.members)
          ? dir.members.map((m) => m.memberId)
          : [],
      });
      setHasExistingLogo(Boolean(dir?.logoUrl));
      setSubmitAttempted(false);

      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching directory detail:", error);
      showAlert("Failed to load directory details", "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isFormValid) {
      showAlert("Please fill all required fields", "Validation Error", "warning");
      return;
    }

    setLoading(true);
    try {
      let res;

      if (editingId) {
        res = await updateMemberDirectory(editingId, form);
      } else {
        res = await createMemberDirectory(form);
      }

      if (res?.success) {
        handleCloseDialog();
        await fetchDirectories();
        showAlert(
          editingId ? "Member directory updated successfully" : "Member directory created successfully",
          "Success",
          "success"
        );
      } else {
        showAlert(res?.message || "No response from server", "Error", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showAlert("No response from server", "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await deleteMemberDirectory(deleteTarget.id);

      if (res?.success) {
        await fetchDirectories();
        showAlert("Member directory deleted successfully", "Success", "success");
      } else {
        showAlert(res?.message || "Delete failed", "Error", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showAlert("No response from server while deleting member directory", "Error", "error");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const toggleMember = (memberId) => {
    setForm((prev) => {
      const exists = prev.memberIds.includes(memberId);

      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => id !== memberId)
          : [...prev.memberIds, memberId],
      };
    });
  };

  const getMemberDisplayName = (member) => {
    return (
      member?.companyOrIndividualName ||
      member?.representiveName ||
      member?.applicantName ||
      member?.name ||
      member?.companyName ||
      `Member #${member?.memberId || ""}`
    );
  };

  const getMemberSubText = (member) => {
    return (
      member?.representivePosition ||
      member?.applicantPosition ||
      member?.natureOfBusiness ||
      member?.email ||
      ""
    );
  };

  const getMemberImage = (member) => {
    if (!member?.companyOrIndividualImage) return "";
    return `${baseImageURL}${member.companyOrIndividualImage}`;
  };

  const selectedMembersCount = useMemo(() => form.memberIds.length, [form.memberIds]);

  const columns = [
    {
      field: "logoUrl",
      headerName: "Logo",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          src={params.value ? `${baseImageURL}${params.value}` : undefined}
          variant="rounded"
          sx={{
            width: 42,
            height: 42,
            borderRadius: "10px",
            bgcolor: "#eef2ff",
          }}
        >
          {!params.value && <PersonIcon />}
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography fontWeight={700}>{params.value || "-"}</Typography>
      ),
    },
    {
      field: "subtitle",
      headerName: "Subtitle",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "website",
      headerName: "Website",
      flex: 1,
      minWidth: 220,
      renderCell: (params) =>
        params.value ? (
          <Button
            size="small"
            startIcon={<LanguageIcon />}
            href={
              String(params.value).startsWith("http")
                ? params.value
                : `https://${params.value}`
            }
            target="_blank"
            rel="noreferrer"
            sx={{ textTransform: "none" }}
          >
            Open
          </Button>
        ) : (
          "-"
        ),
    },
    {
      field: "createdAt",
      headerName: "Created Date",
      minWidth: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString() : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="primary"
            onClick={() => handleOpenEdit(params.row)}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => handleDelete(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
      }}
    >
      {loading && <OverlayLoader message="Processing..." />}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: "#182848" }}>
            Member Directories
          </Typography>
          <Typography variant="body1" sx={{ color: "#667085", mt: 0.5 }}>
            Directory list with DataGrid. Members load only on detail API.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            px: 2.5,
            py: 1.2,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Add Directory
        </Button>
      </Stack>

      <Paper
        sx={{
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #eaecf0",
          boxShadow: "0 10px 30px rgba(16,24,40,0.06)",
        }}
      >
        <DataGrid
          rows={directories}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              fontWeight: 700,
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
            },
          }}
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} mb={0.5}>
            {editingId ? "Update Directory" : "Create Directory"}
          </Typography>
          <Typography variant="body2" color="#667085" mb={3}>
            Members are loaded from detail API only when editing.
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Company Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              error={submitAttempted && formErrors.name}
              helperText={submitAttempted && formErrors.name ? "Required" : ""}
            />

            <TextField
              label="Position"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              fullWidth
              required
              error={submitAttempted && formErrors.subtitle}
              helperText={submitAttempted && formErrors.subtitle ? "Required" : ""}
            />

            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={3}
              required
              error={submitAttempted && formErrors.description}
              helperText={submitAttempted && formErrors.description ? "Required" : ""}
            />

            <TextField
              label="Website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              fullWidth
            />

            <Box>
              <Typography fontWeight={700} mb={1}>
                Upload Logo <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm({
                    ...form,
                    logoUrl: e.target.files?.[0] || null,
                  })
                }
              />
              {submitAttempted && formErrors.logoUrl && (
                <Typography color="error" variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  Required
                </Typography>
              )}
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography fontWeight={700}>Select Members</Typography>
                <Chip
                  label={`${selectedMembersCount} selected`}
                  color="primary"
                  variant="outlined"
                />
              </Stack>

              <Box
                sx={{
                  maxHeight: 320,
                  overflowY: "auto",
                  border: "1px solid #eaecf0",
                  borderRadius: "14px",
                  p: 1.5,
                  backgroundColor: "#f8fafc",
                }}
              >
                <Stack spacing={1.2}>
                  {members.map((m) => {
                    const selected = form.memberIds.includes(m.memberId);
                    const displayName = getMemberDisplayName(m);
                    const subText = getMemberSubText(m);
                    const imageUrl = getMemberImage(m);

                    return (
                      <Paper
                        key={m.memberId}
                        onClick={() => toggleMember(m.memberId)}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: "14px",
                          border: selected
                            ? "1px solid #2563eb"
                            : "1px solid #e5e7eb",
                          backgroundColor: selected ? "#eff6ff" : "#fff",
                          cursor: "pointer",
                          transition: "0.2s ease",
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={imageUrl || undefined}
                            alt={displayName}
                            sx={{
                              width: 52,
                              height: 52,
                              backgroundColor: "#dbeafe",
                              color: "#1d4ed8",
                            }}
                          >
                            {!imageUrl && <PersonIcon />}
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700}>
                              {displayName}
                            </Typography>

                            {!!subText && (
                              <Typography variant="body2" color="#667085">
                                {subText}
                              </Typography>
                            )}

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                              mt={0.8}
                            >
                              {!!m.memberCode && (
                                <Chip
                                  size="small"
                                  label={m.memberCode}
                                  variant="outlined"
                                />
                              )}
                              {!!m.natureOfBusiness && (
                                <Chip
                                  size="small"
                                  label={m.natureOfBusiness}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>

                          <Chip
                            label={selected ? "Selected" : "Select"}
                            color={selected ? "primary" : "default"}
                            size="small"
                          />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" pt={1}>
              <Button
                variant="outlined"
                onClick={handleCloseDialog}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                {editingId ? "Update" : "Submit"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>

      <CommonConfirmDialog
        open={!!deleteTarget}
        title="Delete Member Directory"
        message={`Delete "${deleteTarget?.name || "this directory"}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={loading && !!deleteTarget}
        confirmText="Delete"
        confirmColor="error"
      />

      <CommonAlertDialog
        open={alertDialog.open}
        title={alertDialog.title}
        message={alertDialog.message}
        color={alertDialog.color}
        onClose={() => setAlertDialog((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default MemberDirectoryPage;
