import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Box,
    IconButton,
    CircularProgress,
    Avatar,
    Paper,
    Link,
    MenuItem,
    Select,
    Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getEventDetail, updateRegistrationPaidStatus } from "../controllers/EventController";
import { baseImageURL } from "../config/api";

const eventTypeOptions = [
    { value: "inPerson", label: "In Person" },
    { value: "online", label: "Online" },
];

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
};


export default function EventDetailDialog({ selectedEvent, setSelectedEvent }) {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedGuests, setExpandedGuests] = useState({});
    const [paidChanges, setPaidChanges] = useState({});
    const [loadingChanges, setLoadingChanges] = useState({});
    const [filter, setFilter] = useState("All"); // All, Paid, Unpaid

    const format12HourTime = (time24) => {
        if (!time24) return "-";
        const [hStr, mStr] = time24.split(":");
        let hour = parseInt(hStr, 10);
        const minute = parseInt(mStr, 10);
        const period = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;

        // Only include minutes if not 00
        return minute === 0 ? `${hour} ${period}` : `${hour}:${mStr} ${period}`;
    };


    useEffect(() => {
        if (selectedEvent?.eventid) {
            fetchEventDetail(selectedEvent.eventid);
        }
    }, [selectedEvent]);

    const fetchEventDetail = async (eventId) => {
        setLoading(true);
        setError("");
        try {
            const res = await getEventDetail(eventId);
            if (res?.success && Array.isArray(res.data)) {
                setRegistrations(res.data);
            } else {
                setRegistrations([]);
                setError("No registration data found.");
            }
        } catch (err) {
            console.error("Error fetching event detail:", err);
            setError("Failed to load registration list.");
        } finally {
            setLoading(false);
        }
    };

    const toggleGuests = (registrationId) => {
        setExpandedGuests((prev) => ({
            ...prev,
            [registrationId]: !prev[registrationId],
        }));
    };

    const handlePaidSelectChange = (registrationId, value) => {
        setPaidChanges((prev) => ({
            ...prev,
            [registrationId]: value,
        }));
    };

    const handlePaidUpdate = async (registrationId) => {
        if (!(registrationId in paidChanges)) return;

        const newStatus = paidChanges[registrationId] === "Paid";

        try {
            setLoadingChanges((prev) => ({ ...prev, [registrationId]: true }));

            const res = await updateRegistrationPaidStatus(registrationId, newStatus);

            if (res.success) {
                setRegistrations((prev) =>
                    prev.map((reg) =>
                        reg.registrationId === registrationId ? { ...reg, isPaid: newStatus } : reg
                    )
                );

                setPaidChanges((prev) => {
                    const copy = { ...prev };
                    delete copy[registrationId];
                    return copy;
                });
            } else {
                console.error("API failed:", res.message);
            }
        } catch (err) {
            console.error("Failed to update:", err);
        } finally {
            setLoadingChanges((prev) => ({ ...prev, [registrationId]: false }));
        }
    };

    // Filter registrations based on selected filter
    const filteredRegistrations = registrations.filter((reg) => {
        if (filter === "Paid") return reg.isPaid;
        if (filter === "Unpaid") return !reg.isPaid;
        return true; // All
    });

    return (
        <Dialog
            open={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
            maxWidth="lg"
            fullWidth
        >
            {selectedEvent && (
                <>
                    <DialogTitle>
                        {selectedEvent.eventTitle}
                        <IconButton
                            onClick={() => setSelectedEvent(null)}
                            sx={{ position: "absolute", right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent dividers>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", height: "80vh" }}>
                            {/* Event Details */}
                            <Paper
                                sx={{
                                    flex: 1,
                                    minWidth: 300,
                                    p: 2,
                                    maxHeight: "100%",
                                    overflowY: "auto",
                                }}
                            >
                                {selectedEvent?.eventImage && (
                                    <Box
                                        component="img"
                                        src={
                                            selectedEvent.eventImage.startsWith("http")
                                                ? selectedEvent.eventImage
                                                : `${baseImageURL}${selectedEvent.eventImage}`
                                        }
                                        alt={selectedEvent.eventTitle}
                                        sx={{
                                            width: "100%",
                                            maxHeight: 300,
                                            objectFit: "cover",
                                            borderRadius: 2,
                                            mb: 2,
                                        }}
                                    />
                                )}
                                <Typography>
                                    <b>Date:</b> {formatDate(selectedEvent?.eventDate)}
                                </Typography>
                                <Typography>
                                    <b>Start Time:</b> {format12HourTime(selectedEvent?.startTime)}
                                </Typography>
                                <Typography>
                                    <b>End Time:</b> {format12HourTime(selectedEvent?.endTime)}
                                </Typography>
                                <Typography>
                                    <b>Location:</b> {selectedEvent?.eventLocation}
                                </Typography>
                                <Typography>
                                    <b>Type:</b>{" "}
                                    {eventTypeOptions.find(
                                        (opt) => opt.value === selectedEvent?.eventType
                                    )?.label || selectedEvent?.eventType}
                                </Typography>
                                <Typography>
                                    <b>Fee:</b> {selectedEvent?.eventFee || "Free"}
                                </Typography>
                                <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>
                                    {selectedEvent?.eventDescription}
                                </Typography>
                                <Typography sx={{ mt: 1 }}>
                                    <b>Rule:</b> {selectedEvent?.eventRule}
                                </Typography>
                            </Paper>

                            {/* Registration List */}
                            <Paper
                                sx={{
                                    flex: 1,
                                    minWidth: 300,
                                    p: 2,
                                    maxHeight: "100%",
                                    overflowY: "auto",
                                }}
                            >
                                {/* Filter + Refresh */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="h6">Registered Members</Typography>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Select
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                            sx={{ minWidth: 120 }}
                                        >
                                            <MenuItem value="All">All</MenuItem>
                                            <MenuItem value="Paid">Paid</MenuItem>
                                            <MenuItem value="Unpaid">Unpaid</MenuItem>
                                        </Select>
                                        <Button
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            onClick={() => fetchEventDetail(selectedEvent.eventid)}
                                        >
                                            Refresh
                                        </Button>
                                    </Box>
                                </Box>

                                {loading && (
                                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                        <CircularProgress size={30} />
                                    </Box>
                                )}

                                {error && !loading && (
                                    <Typography color="error" sx={{ mt: 1 }}>
                                        {error}
                                    </Typography>
                                )}

                                {!loading && !error && filteredRegistrations.length === 0 && (
                                    <Typography>No registrations found.</Typography>
                                )}

                                {!loading &&
                                    filteredRegistrations.length > 0 &&
                                    filteredRegistrations.map((reg) => {
                                        const paidValue =
                                            paidChanges[reg.registrationId] ?? (reg.isPaid ? "Paid" : "Not Paid");
                                        const showUpdateIcon =
                                            paidChanges[reg.registrationId] &&
                                            paidChanges[reg.registrationId] !== (reg.isPaid ? "Paid" : "Not Paid");
                                        const isUpdating = loadingChanges[reg.registrationId] || false;

                                        return (
                                            <Paper
                                                key={reg.registrationId}
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 1,
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    backgroundColor: "#fafafa",
                                                    mb: 1,
                                                }}
                                            >
                                                {/* Member Info */}
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                    <Avatar
                                                        src={
                                                            reg.companyOrIndividualImage
                                                                ? `${baseImageURL}${reg.companyOrIndividualImage}`
                                                                : undefined
                                                        }
                                                        alt={reg.companyOrIndividualName}
                                                        sx={{ width: 48, height: 48 }}
                                                    />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography fontWeight="bold">
                                                            {reg.representiveName}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            <b>Member Included:</b> {reg.isMemberInclude ? "Yes" : "No"}
                                                        </Typography>
                                                    </Box>

                                                    {/* Paid dropdown */}
                                                    {selectedEvent.feeType === "Paid" && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Select
                                                                value={paidValue}
                                                                onChange={(e) =>
                                                                    handlePaidSelectChange(reg.registrationId, e.target.value)
                                                                }
                                                                sx={{
                                                                    minWidth: 120,
                                                                    backgroundColor: paidValue === "Paid" ? "#90EE90" : "#FF7F7F",
                                                                    borderRadius: 1,
                                                                }}
                                                                disabled={isUpdating}
                                                            >
                                                                <MenuItem value="Paid">Paid</MenuItem>
                                                                <MenuItem value="Not Paid">Not Paid</MenuItem>
                                                            </Select>

                                                            {showUpdateIcon && (
                                                                <IconButton
                                                                    onClick={() => handlePaidUpdate(reg.registrationId)}
                                                                    color="primary"
                                                                    disabled={isUpdating}
                                                                >
                                                                    {isUpdating ? <CircularProgress size={20} /> : <CheckIcon />}
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* Guests */}
                                                {reg.guests?.length > 0 && (
                                                    <Box sx={{ mt: 1, ml: 7 }}>
                                                        <Link
                                                            component="button"
                                                            variant="body2"
                                                            onClick={() => toggleGuests(reg.registrationId)}
                                                        >
                                                            {expandedGuests[reg.registrationId]
                                                                ? "Hide Guests"
                                                                : `Show Guests (${reg.guests.length})`}
                                                        </Link>

                                                        {expandedGuests[reg.registrationId] && (
                                                            <Box sx={{ mt: 1 }}>
                                                                {reg.guests.map((g, idx) => (
                                                                    <Typography key={idx} variant="body2">
                                                                        {g.guestName} ({g.guestPhone})
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                )}
                                            </Paper>
                                        );
                                    })}
                            </Paper>
                        </Box>
                    </DialogContent>
                </>
            )}
        </Dialog>
    );
}
