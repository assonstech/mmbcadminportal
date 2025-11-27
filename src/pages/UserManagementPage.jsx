import * as React from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import MemberFormDialog from '../components/usermanagement/MemberFormDialog';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem
} from '@mui/x-data-grid';
import { useMembers } from '../hooks/useMember';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../config/api';
import {
  checkMember,
  createMember,
  deleteImage,
  deleteMember,
  updateMember
} from '../controllers/MemberController';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function UserManagementPage() {
  const { rows, setRows, memberTypes, nrcTypes, nrcTownships, loading } = useMembers();

  const initialForm = {
    memberId: "",
    memberCode: "",
    typeOfMembershipId: "",
    companyOrIndividualName: "",
    email: "",
    phone: "",
    companyOrIndividualImage: "",
    companyOrIndividualAddress: "",
    memberNRC: "",
    applicantPosition: "",
    memberNationality: "",
    website: "",
    ownerMalaysia: false,
    ownerMyanmar: false,
    ownerOther: false,
    natureOfBusiness: "",
    applicantSignatureImage: "",
    isBOD: false,
    status: "Approved",
    createdBy: "",
    createdDate: "",
    passwordHash: "",
    otherOwnerName: "",
    telephone: "",
    dateOfRegistration: "",
    placeOfRegistration: "",
    ownerType: "",
    whatsApp: "",
    memberPosition: "",
    representiveName: "",
    representivePosition: "",
    representiveNRC: "",
    representiveNationality: "",
    applicantName: "",
    applicationDate: "",
    startDate: "",
    endDate: "",
    parentMemberId: null,
    ecPosition: "",
    isCEO: false,
    documentType: 'nrc'
  };

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(initialForm);
  const [errors, setErrors] = React.useState({});
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [prevImages, setPrevImages] = React.useState({
    profileImage: "",
    signatureImage: ""
  });
  const [saveLoading, setSaveLoading] = React.useState(false);
  const nrcRef = React.useRef();

  // ✅ Unified Snackbar
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success"
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUpload = async (profileImage, signatureImage) => {
    try {
      const formData = new FormData();
      if (profileImage instanceof File) formData.append("profileImage", profileImage);
      if (signatureImage instanceof File) formData.append("signatureImage", signatureImage);

      const res = await api.post(`/member-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        return {
          success: true,
          profileImage: res.data.filenames.profileImage || form.companyOrIndividualImage || "",
          signatureImage: res.data.filenames.signatureImage || form.applicantSignatureImage || ""
        };
      } else return null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const saveUser = async () => {
    let tempErrors = {};

    if (!form.memberCode) tempErrors.memberCode = "Member Code is required";
    if (!form.companyOrIndividualName) tempErrors.companyOrIndividualName = "Company Or Individual Name is required";
    if (!form.companyOrIndividualAddress) tempErrors.companyOrIndividualAddress = "Company Or Individual Address is required";
    if (!form.representiveName) tempErrors.representiveName = "Member Or Representive Name is required";
    if (!form.representivePosition) tempErrors.representivePosition = "Member or Representive Position is required";
    if (!form.representiveNationality) tempErrors.representiveNationality = "Member or Representive Nationality is required";
    if (!form.dateOfRegistration) tempErrors.dateOfRegistration = "date of Registration is required";
    if (!form.email) tempErrors.email = "Email is required";
    if (!form.passwordHash && !form.memberId) tempErrors.passwordHash = "Default Password is required";
    if (!form.typeOfMembershipId) tempErrors.typeOfMembershipId = "Membership Type is required";
    if (!form.applicantName) tempErrors.applicantName = "Applicant Name is required";
    // if (!form.applicantSignatureImage) tempErrors.applicantSignatureImage = "Signature is required";
    if (!form.applicationDate) tempErrors.applicationDate = "Application Date is required";
    if (!form.applicantPosition) tempErrors.applicantPosition = "Applicant Position is required";
    if (!form.startDate) tempErrors.startDate = "Start Date is required";
    if (!form.endDate) tempErrors.endDate = "End Date is required";
    if (!form.companyOrIndividualImage) tempErrors.companyOrIndividualImage = "Profile Image is required";
    if (!form.telephone) tempErrors.telephone = "telephone is required";
    if (!form.whatsApp) tempErrors.whatsApp = "whatsApp is required";
    if (!form.natureOfBusiness) tempErrors.natureOfBusiness = "natureOfBusiness is required";


    if (form.documentType === "nrc") {
      if (nrcRef.current && !nrcRef.current.validate()) {
        tempErrors.memberNRC = "NRC is invalid";
      }
    } else if (form.documentType === "passport") {
      if (!form.memberNRC || form.memberNRC.trim() === "") {
        tempErrors.memberNRC = "Passport number is required";
      }
    }

    if (form.isBOD && !form.isCEO) {
      if (!form.ecPosition) {
        tempErrors.ecPosition = "EC Position is required for BOD members";
      }
      if (!form.parentMemberId) {
        tempErrors.parentMemberId = "Parent Member is required for BOD members";
      }
    }


    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }

    setSaveLoading(true);

    if (!form.memberId) {
      const check = await checkMember(form.email);

      if (check?.exists) {
        setErrors(prev => ({
          ...prev,
          email: "This email is already registered"
        }));
        showSnackbar("Email already exists!", "warning");
        setSaveLoading(false)
        return;
      }
    }

    const isNewProfileImage = form.companyOrIndividualImage instanceof File;
    const isNewSignatureImage = form.applicantSignatureImage instanceof File || form.applicantSignatureImage === "";

    let uploaded = null;

    // Upload if new file OR user cleared the image
    if (isNewProfileImage || isNewSignatureImage) {
      uploaded = await handleUpload(
        isNewProfileImage ? form.companyOrIndividualImage : null,
        isNewSignatureImage ? form.applicantSignatureImage : null
      );

      // Delete old images if needed
      if (isNewProfileImage && prevImages.profileImage && prevImages.profileImage !== uploaded?.profileImage) {
        await deleteImage(prevImages.profileImage);
      }
      if (isNewSignatureImage && prevImages.signatureImage && prevImages.signatureImage !== uploaded?.signatureImage) {
        await deleteImage(prevImages.signatureImage);
      }

      form.companyOrIndividualImage = uploaded?.profileImage || form.companyOrIndividualImage;
      form.applicantSignatureImage = uploaded?.signatureImage || null; // null if removed
    } else {
      form.companyOrIndividualImage = prevImages.profileImage;
      form.applicantSignatureImage = prevImages.signatureImage;
    }

    try {
      let response;
      const payload = { ...form };

      if (!payload.isBOD) {
        payload.ecPosition = "";
        payload.parentMemberId = null;
      }

      if (form.memberId) {
        response = await updateMember(payload.memberId, payload);
      } else {
        delete payload.memberId;
        response = await createMember(payload);
      }

      if (response) {
        if (form.memberId) {
          setRows(prev => prev.map(r => r.memberId === form.memberId ? { ...form } : r));
          showSnackbar("Updated successfully!");
        } else {
          setRows(prev => [
            ...prev,
            { ...form, memberId: response.memberId || (prev.length ? Math.max(...prev.map(r => r.memberId)) + 1 : 1) }
          ]);
          showSnackbar("Saved successfully!");
        }

        setForm(initialForm);
        setErrors({});
        setOpen(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
      showSnackbar("Error saving member", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const formatDateForInput = (value) => {
    if (!value) return "";
    if (value.includes("-")) return value;
    if (value.length !== 8) return "";
    const mm = value.slice(0, 2);
    const dd = value.slice(2, 4);
    const yyyy = value.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    setSaveLoading(true);
    try {
      const res = await deleteMember(selectedMember.memberId);

      if (res.success) {
        await Promise.all([
          selectedMember.companyOrIndividualImage
            ? deleteImage(selectedMember.companyOrIndividualImage)
            : Promise.resolve(),
          selectedMember.applicantSignatureImage
            ? deleteImage(selectedMember.applicantSignatureImage)
            : Promise.resolve()
        ]);

        setRows(prev => prev.filter(r => r.memberId !== selectedMember.memberId));
        showSnackbar("Member and images deleted successfully!");
      } else {
        showSnackbar(res.data.error || "Failed to delete member", "error");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      showSnackbar("Server error while deleting member", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    { field: 'memberCode', headerName: 'Member Code', width: 120 },
    { field: 'representiveName', headerName: 'Member Name', width: 220 },
    { field: 'companyOrIndividualName', headerName: 'Company / Individual', width: 200 },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const value = params.value;
        const color = value === 'Approved' ? 'green' : value === 'Pending' ? 'orange' : 'gray';
        return (
          <span style={{
            color: 'white',
            width: '100%',
            backgroundColor: color,
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            textAlign: 'center',
            display: 'inline-block',
            minWidth: '60px'
          }}>
            {value}
          </span>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            const formattedRow = {
              ...params.row,
              applicationDate: formatDateForInput(params.row.applicationDate),
              dateOfRegistration: formatDateForInput(params.row.dateOfRegistration),
              startDate: formatDateForInput(params.row.startDate),
              endDate: formatDateForInput(params.row.endDate),
              memberId: params.row.memberId
            };
            setForm({ ...formattedRow });
            setPrevImages({
              profileImage: params.row.companyOrIndividualImage,
              signatureImage: params.row.applicantSignatureImage
            });
            setOpen(true);
          }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => {
            setSelectedMember(params.row);
            setDeleteOpen(true);
          }}
        />
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
        <Button variant="contained" onClick={() => { setForm(initialForm); setOpen(true); }}>
          Add Member
        </Button>
      </Stack>

      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.memberId}
          pageSizeOptions={[5, 10, 15, 20, 30]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          loading={loading}
        />

      </Box>

      <MemberFormDialog
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        errors={errors}
        setErrors={setErrors}
        memberTypes={memberTypes}
        nrcTypes={nrcTypes}
        nrcTownships={nrcTownships}
        saveUser={saveUser}
        ref={nrcRef}
        saveLoading={saveLoading}
        initialForm={initialForm}
        memberList={rows}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        memberName={selectedMember?.companyOrIndividualName || ""}
        onConfirm={handleDeleteConfirm}
      />

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

      {/* ✅ Loading Overlay */}
      {saveLoading && (
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
              Saving, please wait...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
