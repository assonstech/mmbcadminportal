import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box, Typography, Grid, TextField, FormControlLabel, Switch, MenuItem, CircularProgress, Checkbox } from '@mui/material';
import { renderField } from './FormField';
import UploadImage from './UploadImage'; // <-- Use your upload component
import NrcField from './NrcField';
import { baseImageURL } from '../../config/api';
export default function MemberFormDialog({
    open,
    setOpen,
    form,
    setForm,
    errors,
    setErrors,
    memberTypes,
    nrcTypes,
    nrcTownships,
    saveUser,
    ref,
    saveLoading,
    initialForm,
    memberList // 👈 Add this new prop

}) {
    console.log("doctype", form.documentType)
    const isIndividual = form.typeOfMembershipId === 3;
    const [agreed, setAgreed] = useState(false);

    const handleClose = () => {
        if (!saveLoading) {
            setForm(initialForm);   // Reset form
            setErrors({});          // Clear errors
            setOpen(false);         // Close dialog
            setAgreed(false)
        }
    };


    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: 20 }}>
                {form.memberId ? "Edit Member" : "Add Member"}
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    opacity: saveLoading ? 0.5 : 1,
                    pointerEvents: saveLoading ? "none" : "auto"
                }}
            >
                <Stack spacing={3}>
                    {/* Membership Info */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>Membership Type Info</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Membership Type"
                                    value={form.typeOfMembershipId || ''}
                                    onChange={(e) => {
                                        const newTypeId = e.target.value;

                                        if (!form.memberId) {
                                            setForm({
                                                ...initialForm,
                                                typeOfMembershipId: newTypeId
                                            });
                                        } else {
                                            // Edit mode → just update type
                                            setForm(f => ({ ...f, typeOfMembershipId: newTypeId }));
                                        }

                                        setErrors({});
                                    }}
                                    fullWidth
                                    sx={{ minWidth: 400 }}
                                    error={!!errors.typeOfMembershipId}
                                    helperText={errors.typeOfMembershipId || ""}
                                >
                                    {memberTypes.map(type => (
                                        <MenuItem key={type.memberTypeId} value={type.memberTypeId}>
                                            {type.memberTypeName} {type.votingRights ? " - Voting Rights" : " - No Voting Rights"} ({type.fees}/{type.feePeriod})
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>{renderField("companyOrIndividualName", "Company / Individual Name", form, setForm, errors, setErrors)}</Grid>


                        </Grid>
                    </Box>
                    <Grid item xs={12} md={6}>{renderField("companyOrIndividualAddress", "Company / Individual Address", form, setForm, errors, setErrors)}</Grid>
                    <Box>
                        <Grid container spacing={2}>

                            {/* match DB spelling: placeOfRegistraion */}
                            <Grid item xs={12} md={6}>{renderField("placeOfRegistration", "Place of Registration", form, setForm, errors, setErrors)}</Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Date of Registration"
                                    type="date"
                                    value={form.dateOfRegistration}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) =>
                                        setForm(f => ({ ...f, dateOfRegistration: e.target.value }))
                                    }
                                    sx={{ minWidth: 300 }}
                                    error={!!errors.dateOfRegistration}
                                    helperText={errors.dateOfRegistration || ""}
                                />
                            </Grid>

                        </Grid>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>Representive Info <span style={{ color: 'red' }}>*</span></Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>{renderField("memberCode", "Member Code", form, setForm, errors, setErrors)}</Grid>

                            <Grid item xs={12} md={6}>{renderField("representiveName", !isIndividual ? "Representative Name" : "Member Name", form, setForm, errors, setErrors)}</Grid>

                            {/* match DB spelling: representivePosition */}
                            <Grid item xs={12} md={6}>{renderField("representivePosition", !isIndividual ? "Representative Position" : "Member Position", form, setForm, errors, setErrors)}</Grid>

                            {/* match DB spelling: representiveNationality */}
                            <Grid item xs={12} md={6}>{renderField("representiveNationality", !isIndividual ? "Representative Nationality" : "Member Nationality", form, setForm, errors, setErrors)}</Grid>
                            <Grid item xs={12} md={6}>{renderField("telephone", "Telephone", form, setForm, errors, setErrors, 'number')}</Grid>

                            <Grid item xs={12} md={6}> {renderField("email", "Email", form, setForm, errors, setErrors)} </Grid>
                            {!form.memberId && (
                                <Grid item xs={12} md={6}>
                                    {renderField("passwordHash", "Default Password", form, setForm, errors, setErrors)}
                                </Grid>
                            )}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={form.startDate}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) =>
                                        setForm(f => ({ ...f, startDate: e.target.value }))
                                    }
                                    sx={{ minWidth: 300 }}
                                    error={!!errors.startDate}
                                    helperText={errors.startDate || ""}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={form.endDate}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) =>
                                        setForm(f => ({ ...f, endDate: e.target.value }))
                                    }
                                    sx={{ minWidth: 300 }}
                                    error={!!errors.endDate}
                                    helperText={errors.endDate || ""}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Status"
                                    value={form.status || "Pending"} // default to Pending if empty
                                    fullWidth
                                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                                    error={!!errors.status}
                                    helperText={errors.status || ""}
                                >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Deleted">Deleted</MenuItem>
                                </TextField>
                            </Grid>

                        </Grid>
                    </Box>
                    <Grid item xs={12} md={6}>
                        <UploadImage
                            label="Profile Photo"
                            image={form.companyOrIndividualImage}
                            setImage={(img) => setForm(f => ({ ...f, companyOrIndividualImage: img }))}
                            error={errors.companyOrIndividualImage}
                            baseURL={`${baseImageURL}`}

                        />
                    </Grid>
                    {/* Document Type Selection */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                            Document Type
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select
                                    label="Document Type"
                                    fullWidth
                                    sx={{ minWidth: 150 }}
                                    value={form.documentType || ""}
                                    onChange={(e) => {
                                        const doc = e.target.value;

                                        setForm(f => ({
                                            ...f,
                                            documentType: doc,
                                            memberNRC: "",          // Reset NRC/Passport value
                                            nrcCode: "",
                                            nrcTownshipId: "",
                                            nrcNumber: "",
                                        }));

                                        setErrors(prev => ({
                                            ...prev,
                                            memberNRC: "",
                                            nrcCode: "",
                                            nrcTownshipId: "",
                                            nrcNumber: "",
                                        }));
                                    }}
                                >
                                    <MenuItem value="nrc">NRC</MenuItem>
                                    <MenuItem value="passport">Passport</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* If NRC Selected → Show NRC Fields */}
                        {form.documentType === "nrc" && (
                            <NrcField
                                form={form}
                                setForm={setForm}
                                errors={errors}
                                setErrors={setErrors}
                                nrcTypes={nrcTypes}
                                nrcTownships={nrcTownships}
                                title={!isIndividual ? "Representive NRC Info" : "Member NRC Info"}
                                ref={ref}
                            />
                        )}

                        {/* If Passport Selected → Show Passport Number */}
                        {form.documentType === "passport" && (
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Passport No"
                                        fullWidth
                                        value={form.memberNRC || ""}   // reuse same DB field
                                        onChange={(e) =>
                                            setForm(f => ({ ...f, memberNRC: e.target.value }))
                                        }
                                        error={!!errors.memberNRC}
                                        helperText={errors.memberNRC || ""}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Box>

                    {/* EC / BOD Info Section */}
                    <Box>
                        <Grid container spacing={2} alignItems="center">
                            {/* EC / BOD Info Section */}
                            {!form.isCEO && (
                                <Box>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={4}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={form.isBOD || false}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;

                                                            setForm(f => {
                                                                if (!f.memberId && !checked) {
                                                                    return { ...f, isBOD: checked, ecPosition: "", parentMemberId: null };
                                                                }
                                                                return { ...f, isBOD: checked };
                                                            });

                                                            setErrors(prev => ({
                                                                ...prev,
                                                                ecPosition: "",
                                                                parentMemberId: ""
                                                            }));
                                                        }}
                                                    />
                                                }
                                                label="Is EC Member?"
                                            />
                                        </Grid>

                                        {/* Only show these fields if isBOD is true and not CEO */}
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                select
                                                label="People Leader"
                                                fullWidth
                                                sx={{ minWidth: 200 }}
                                                value={form.parentMemberId || ""}
                                                onChange={(e) =>
                                                    setForm(f => ({ ...f, parentMemberId: e.target.value }))
                                                }
                                                error={!!errors.parentMemberId}
                                                helperText={errors.parentMemberId || ""}
                                            >
                                                {memberList
                                                    .filter(m => m.isBOD && m.memberId !== form.memberId) // Only BOD members
                                                    .map(m => (
                                                        <MenuItem key={m.memberId} value={m.memberId}>
                                                            {m.representiveName}
                                                        </MenuItem>
                                                    ))}
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="EC Position"
                                                fullWidth
                                                value={form.ecPosition || ""}
                                                onChange={(e) =>
                                                    setForm(f => ({ ...f, ecPosition: e.target.value }))
                                                }
                                                error={!!errors.ecPosition}
                                                helperText={errors.ecPosition || ""}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                        </Grid>
                    </Box>

                    {/* Contact Info */}

                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>Company Info</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>{renderField("natureOfBusiness", "Nature Of Business", form, setForm, errors, setErrors)}</Grid>
                            <Grid item xs={12} md={6}>{renderField("phone", "Phone", form, setForm, errors, setErrors, 'number')}</Grid>
                            <Grid item xs={12} md={6}>{renderField("whatsApp", "WhatsApp", form, setForm, errors, setErrors, 'number')}</Grid>
                            <Grid item xs={12} md={6}>{renderField("website", "Website", form, setForm, errors, setErrors)}</Grid>
                            {/* match DB spelling: representiveName */}
                            <Grid item xs={12} md={6}>{renderField("ownerType", "OwnerType", form, setForm, errors, setErrors)}</Grid>
                        </Grid>
                    </Box>


                    {/* Shareholder Partner */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>Shareholder Partner<span style={{ color: 'red' }}>*</span></Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>{renderField("ownerMalaysia", "Owner Malaysia (%)", form, setForm, errors, setErrors, "number", true, 3)}</Grid>
                            <Grid item xs={12} md={4}>{renderField("ownerMyanmar", "Owner Myanmar (%)", form, setForm, errors, setErrors, "number", true, 3)}</Grid>
                            <Grid item xs={12} md={4}>{renderField("otherOwnerName", "Owner Other (Nationality)", form, setForm, errors, setErrors)}</Grid>
                            {form.otherOwnerName && form.otherOwnerName.trim() !== "" && (

                                <Grid item xs={12} md={4}>{renderField("ownerOther", "Owner Other (%)", form, setForm, errors, setErrors, "number", true, 3)}</Grid>
                            )}

                        </Grid>
                    </Box>

                    {/* NRC Info */}

                    {/* Applicant Info */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>Applicant Info</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>{renderField("applicantName", "Applicant Name", form, setForm, errors, setErrors)}</Grid>
                            <Grid item xs={12} md={6}>{renderField("applicantPosition", "Applicant Position", form, setForm, errors, setErrors)}</Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Application Date"
                                    type="date"
                                    value={form.applicationDate}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                    onChange={(e) =>
                                        setForm(f => ({ ...f, applicationDate: e.target.value }))
                                    }
                                    sx={{ minWidth: 300 }}
                                    error={!!errors.applicationDate}
                                    helperText={errors.applicationDate || ""}
                                />
                            </Grid>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ marginTop: 2 }}>
                            <UploadImage
                                label="Applicant Signature"
                                image={form.applicantSignatureImage}
                                setImage={(img) => setForm(f => ({ ...f, applicantSignatureImage: img }))}
                                error={errors.applicantSignatureImage}
                                baseURL={`${baseImageURL}`}
                            />

                        </Grid>
                    </Box>
                </Stack>
            </DialogContent>

            {!form.memberId && (
                <Box sx={{ mt: 3, p: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                        }
                        label={
                            <Typography sx={{ fontSize: 14 }}>
                                I hereby agree to comply with the Constitution and Regulations of the
                                Malaysia-Myanmar Business Chamber (MMBC) and further state that I am of
                                sound mind and I am not a bankrupt nor have I been convicted for a
                                criminal offence by a court of law.
                            </Typography>
                        }
                    />
                    {!agreed && errors.declaration && (
                        <Typography color="error" sx={{ fontSize: 12 }}>
                            {errors.declaration}
                        </Typography>
                    )}
                </Box>
            )}


            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={saveLoading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={saveUser}
                    disabled={saveLoading || (!form.memberId && !agreed)}
                    startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {form.memberId ? "Update" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

