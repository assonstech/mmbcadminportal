import React, { useState, useEffect } from "react";
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
    Tooltip,
    Card,
    CardMedia,
    CardContent,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";
import {
    AddCircleOutline,
    Edit,
    Visibility,
    Close,
    CalendarMonthOutlined,
    PlaceOutlined,
    DeleteOutline,
} from "@mui/icons-material";
import {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from "../controllers/EventController";
import api, { baseImageURL, baseURL } from "../config/api";
import { deleteImage, sendNotification } from "../controllers/MemberController";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import mixpanel from "../config/mixpanel";
import { useAuth } from "../auth/AuthContext";
import EventDetailDialog from "../components/EventDetailDialog";

const eventTypeOptions = [
    { value: "online", label: "Online" },
    { value: "inPerson", label: "In-Person" },
];

const formatDateForInput = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
};

const convertTo24Hour = ({ hour, minute, period }) => {
    let h = parseInt(hour, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
};



const convert24To12Hour = (time24) => {
    if (!time24) return { hour: "9", minute: "00", period: "AM" };
    const [hStr, mStr] = time24.split(":");
    let hour = parseInt(hStr, 10);
    const minute = mStr;
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return { hour: hour.toString(), minute, period };
};

const emptyForm = {
    eventid: "",
    eventTitle: "",
    eventDate: "",
    eventRule: "",
    eventDescription: "",
    eventImage: null,
    eventFee: "",
    eventType: "",
    eventLocation: "",
    feeType: "Free",
    createdBy: "",
    createdDate: "",
    updatedBy: "",
    updatedDate: "",
    startTime: { hour: "9", minute: "00", period: "AM" },
    endTime: { hour: "5", minute: "00", period: "PM" },
};

const EventManagementPage = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEventToDelete, setSelectedEventToDelete] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [previousImage, setPreviousImage] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const [validationErrors, setValidationErrors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = ["00", "15", "30", "45"];
    const periods = ["AM", "PM"];


    const filteredEvents = events.filter((event) => {
        const search = searchTerm.toLowerCase();
        return (
            event.eventTitle?.toLowerCase().includes(search) ||
            event.eventLocation?.toLowerCase().includes(search) ||
            event.eventDescription?.toLowerCase().includes(search) ||
            event.eventFee?.toString().includes(search)
        );
    });

    const fetchEvents = async (setLoadingName) => {
        try {
            setLoadingName(true);
            const res = await getAllEvents();
            if (res.success) {
                const data = res.data.map((ev) => ({
                    ...ev,
                    eventImage: ev.eventImage ? baseImageURL + ev.eventImage : null,
                }));
                setEvents(data);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoadingName(false);
        }
    };

    useEffect(() => {
        fetchEvents(setLoading);
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setForm((f) => ({ ...f, eventImage: file }));
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        } else setPreviewImage(null);
    };

    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            if (file instanceof File) formData.append("eventImage", file);
            const res = await api.post(`/single-upload/eventImage`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) return res.data.eventImage;
            return null;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };

    const validateForm = () => {
        const requiredFields = [
            "eventTitle",
            "eventDate",
            "eventLocation",
            "eventType",
            "feeType",
            "eventDescription",
            "eventRule",
            "eventImage", // ✅ Add this line

        ];
        if (form.feeType === "Paid") requiredFields.push("eventFee"); // Only require fee if Paid

        const errors = requiredFields.filter((f) => {
            if (f === "eventImage") {
                // ✅ Only require image if creating or if user cleared existing image
                return !form.eventImage;
            }
            const value = form[f];
            return !value || value.toString().trim() === "";
        });
        setValidationErrors(errors);
        return errors.length === 0;
    };

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
            setSaving(true);
            let finalImage = form.eventImage;

            if (form.eventImage instanceof File) {
                const uploadedFileName = await handleUpload(form.eventImage);
                if (uploadedFileName) {
                    finalImage = uploadedFileName;
                    if (previousImage) await deleteImage(previousImage);
                }
            }

            // ✅ Transform eventFee only for API
            const payload = {
                ...form,
                eventImage: finalImage,
                startTime: convertTo24Hour(form.startTime),
                endTime: convertTo24Hour(form.endTime),
                eventFee: form.feeType === "Free" ? null : form.eventFee,
            };

            let res = editing
                ? await updateEvent(form.eventid, payload)
                : await createEvent(payload);

            if (res.success) {
                if (!editing) {
                    await sendNotification(
                        "New Event Created",
                        `Event "${form.eventTitle}" has been scheduled on ${form.eventDate}.`
                    );
                }
                await fetchEvents(setSaving);
                mixpanel.track("Requested API", {
                    apiName: editing ? "Update Event" : "Create Event",
                    createdBy: user?.id || "Unknown",
                });

                setSnackbar({
                    open: true,
                    message: editing
                        ? "Event updated successfully"
                        : "Event created successfully",
                    severity: "success",
                });
                handleClose();

            }
        } catch (err) {
            console.error("Error saving event:", err);
            setSnackbar({
                open: true,
                message: "Error saving event",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = (ev) => {
        setSelectedEventToDelete(ev);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedEventToDelete) return;

        try {
            setSaving(true);
            const res = await deleteEvent(selectedEventToDelete.eventid);
            if (res.success) {
                await fetchEvents(setSaving);
                if (selectedEventToDelete.eventImage) {
                    const filename = selectedEventToDelete.eventImage.replace(
                        baseImageURL,
                        ""
                    );
                    await deleteImage(filename);
                    mixpanel.track("Requested API", {
                        apiName: "Delete Event",
                        createdBy: user?.id || "Unknown",
                    });
                }
            }
        } catch (err) {
            console.error("Error deleting event:", err);
            setSnackbar({
                open: true,
                message: "Error deleting event",
                severity: "error",
            });
        } finally {
            setSaving(false);
            setDeleteOpen(false);
            setSelectedEventToDelete(null);
            setSnackbar({
                open: true,
                message: "Event deleted successfully",
                severity: "success",
            });
        }
    };

    const handleEdit = (ev) => {
        const filename = ev.eventImage ? ev.eventImage.replace(baseImageURL, "") : null;
        setForm({
            ...ev,
            eventDate: formatDateForInput(ev.eventDate),
            eventImage: filename,
            feeType: ev.feeType || "Free", // preserve feeType if exists
            startTime: convert24To12Hour(ev.startTime), // ← convert 24h to 12h
            endTime: convert24To12Hour(ev.endTime),     // ← convert 24h to 12h
        });
        setPreviewImage(ev.eventImage || null);
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

    const handleView = (ev) => setSelectedEvent(ev);

    return (
        <Box sx={{ p: 3, position: "relative" }}>
            {/* Full-page loading */}
            {saving && (
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
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    top: 0,
                    zIndex: 1000,
                    mb: 5,
                }}
            >
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Typography variant="h5" fontWeight="bold">
                        Events Management
                    </Typography>
                    <TextField
                        label="Search Events"
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
                    Add Event
                </Button>
            </Box>

            {/* Event Cards */}
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
                                "&:hover": { transform: "translateY(-5px)" },
                                transition: "0.3s",
                            }}
                        >
                            <Box sx={{ height: 180, bgcolor: "#e0e0e0" }} />
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box sx={{ height: 24, bgcolor: "#e0e0e0", borderRadius: 1, width: "80%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "50%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "70%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "60%" }} />
                                <Box sx={{ height: 18, bgcolor: "#e0e0e0", borderRadius: 1, width: "40%" }} />
                            </CardContent>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 1, borderTop: "1px solid #eee" }}>
                                <Box sx={{ width: 24, height: 24, bgcolor: "#e0e0e0", borderRadius: "50%" }} />
                                <Box sx={{ width: 24, height: 24, bgcolor: "#e0e0e0", borderRadius: "50%" }} />
                                <Box sx={{ width: 24, height: 24, bgcolor: "#e0e0e0", borderRadius: "50%" }} />
                            </Box>
                        </Card>
                    ))
                ) : filteredEvents.length ? (
                    filteredEvents.map((ev) => (
                        <Card
                            key={ev.eventid}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                transition: "0.3s",
                                "&:hover": { transform: "translateY(-5px)" },
                            }}
                        >
                            {ev.eventImage && (
                                <CardMedia
                                    component="img"
                                    height="180"
                                    image={ev.eventImage}
                                    alt={ev.eventTitle}
                                    style={{
                                        width: '100%',          // full card width
                                        height: '180px',        // fixed height
                                        objectFit: 'fill',     // crop image to fill while keeping aspect ratio
                                        objectPosition: 'center'// center the image
                                    }}
                                />
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" noWrap>{ev.eventTitle}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {eventTypeOptions.find((opt) => opt.value === ev.eventType)?.label || ev.eventType}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                    <CalendarMonthOutlined fontSize="small" />
                                    <Typography variant="body2">{new Date(ev.eventDate).toLocaleDateString()}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <PlaceOutlined fontSize="small" />
                                    <Typography variant="body2">{ev.eventLocation}</Typography>
                                </Box>
                                <Typography variant="body2">Fee: {ev.feeType === "Paid" ? ev.eventFee : "Free"}</Typography>
                            </CardContent>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, p: 1, borderTop: "1px solid #eee" }}>
                                <Tooltip title="View Details">
                                    <IconButton onClick={() => handleView(ev)} size="small">
                                        <Visibility fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton onClick={() => handleEdit(ev)} size="small">
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton onClick={() => handleDelete(ev)} size="small">
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Card>
                    ))
                ) : (
                    <Box sx={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                        <Typography variant="h6" color="text.secondary">No Events found</Typography>
                    </Box>
                )}
            </Box>

            {/* Add/Edit Modal */}
            <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editing ? "Edit Event" : "Create Event"}
                    <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ position: "relative" }}>
                    {saving && (
                        <Box
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(255,255,255,0.6)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 20,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, opacity: saving ? 0.5 : 1 }}>
                        <TextField
                            label="Event Title"
                            value={form.eventTitle}
                            disabled={saving}
                            error={validationErrors.includes("eventTitle")}
                            helperText={validationErrors.includes("eventTitle") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, eventTitle: e.target.value }))}
                        />
                        <TextField
                            label="Event Date"
                            type="date"
                            value={form.eventDate}
                            disabled={saving}
                            error={validationErrors.includes("eventDate")}
                            helperText={validationErrors.includes("eventDate") && "Required"}
                            InputLabelProps={{ shrink: true }}
                            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                        />
                        {/* Start and End Time - Label Vertical, Dropdowns Horizontal */}
                        <Box sx={{ display: "flex", gap: 4 }}>
                            {/* Start Time */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography>Start Time</Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <FormControl size="small">
                                        <Select
                                            value={form.startTime.hour}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, startTime: { ...f.startTime, hour: e.target.value } }))
                                            }
                                        >
                                            {hours.map((h) => (
                                                <MenuItem key={h} value={h}>{h}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <Select
                                            value={form.startTime.minute}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, startTime: { ...f.startTime, minute: e.target.value } }))
                                            }
                                        >
                                            {minutes.map((m) => (
                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <Select
                                            value={form.startTime.period}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, startTime: { ...f.startTime, period: e.target.value } }))
                                            }
                                        >
                                            {periods.map((p) => (
                                                <MenuItem key={p} value={p}>{p}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            {/* End Time */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography>End Time</Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <FormControl size="small">
                                        <Select
                                            value={form.endTime.hour}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, endTime: { ...f.endTime, hour: e.target.value } }))
                                            }
                                        >
                                            {hours.map((h) => (
                                                <MenuItem key={h} value={h}>{h}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <Select
                                            value={form.endTime.minute}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, endTime: { ...f.endTime, minute: e.target.value } }))
                                            }
                                        >
                                            {minutes.map((m) => (
                                                <MenuItem key={m} value={m}>{m}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small">
                                        <Select
                                            value={form.endTime.period}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, endTime: { ...f.endTime, period: e.target.value } }))
                                            }
                                        >
                                            {periods.map((p) => (
                                                <MenuItem key={p} value={p}>{p}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Box>


                        <FormControl fullWidth error={validationErrors.includes("eventType")}>
                            <InputLabel id="event-type-label">Event Type</InputLabel>
                            <Select
                                labelId="event-type-label"
                                id="event-type"
                                value={form.eventType}
                                disabled={saving}
                                onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                                label="Event Type"
                            >
                                {eventTypeOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {validationErrors.includes("eventType") && (
                                <Typography color="error" variant="caption">
                                    Required
                                </Typography>
                            )}
                        </FormControl>

                        <TextField
                            label="Event Location"
                            value={form.eventLocation}
                            disabled={saving}
                            error={validationErrors.includes("eventLocation")}
                            helperText={validationErrors.includes("eventLocation") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, eventLocation: e.target.value }))}
                        />

                        {/* Fee Type Radio Buttons */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>Fee Type</Typography>
                            <RadioGroup
                                row
                                value={form.feeType}
                                onChange={(e) => setForm((f) => ({ ...f, feeType: e.target.value }))}
                            >
                                <FormControlLabel value="Free" control={<Radio />} label="Free" />
                                <FormControlLabel value="Paid" control={<Radio />} label="Paid" />
                            </RadioGroup>
                        </Box>

                        {/* Event Fee (only if Paid) */}
                        {form.feeType === "Paid" && (
                            <TextField
                                label="Event Fee"
                                value={form.eventFee}
                                disabled={saving}
                                error={validationErrors.includes("eventFee")}
                                helperText={validationErrors.includes("eventFee") && "Required"}
                                onChange={(e) => setForm((f) => ({ ...f, eventFee: e.target.value.replace(/[^0-9]/g, '') }))}
                            />
                        )}

                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Event Image <span style={{ color: "red" }}>*</span>
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                disabled={saving}
                                onChange={handleImageChange}
                            />
                            {validationErrors.includes("eventImage") && (
                                <Typography color="error" variant="caption">
                                    Required
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

                        <TextField
                            label="Event Description"
                            multiline
                            minRows={3}
                            value={form.eventDescription}
                            disabled={saving}
                            error={validationErrors.includes("eventDescription")}
                            helperText={validationErrors.includes("eventDescription") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, eventDescription: e.target.value }))}
                        />
                        <TextField
                            label="Event Rule"
                            multiline
                            minRows={2}
                            value={form.eventRule}
                            disabled={saving}
                            error={validationErrors.includes("eventRule")}
                            helperText={validationErrors.includes("eventRule") && "Required"}
                            onChange={(e) => setForm((f) => ({ ...f, eventRule: e.target.value }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving && <CircularProgress size={16} />}
                    >
                        {editing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            <EventDetailDialog selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <DeleteConfirmDialog
                open={deleteOpen}
                setOpen={setDeleteOpen}
                memberName={selectedEventToDelete?.eventTitle || ""}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
};

export default EventManagementPage;
