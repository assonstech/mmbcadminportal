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
    MenuItem,
    Select,
    Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getEventDetail, updateRegistrationPaidStatus } from "../controllers/EventController";
import { sendNotification } from "../controllers/MemberController";
import { createNotification } from "../controllers/NotificationController";
import { baseImageURL } from "../config/api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CommonAlertDialog from "./CommonAlertDialog";

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
    const [paidChanges, setPaidChanges] = useState({});
    const [loadingChanges, setLoadingChanges] = useState({});
    const [filter, setFilter] = useState("All"); // All, Paid, Unpaid
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: "Notice",
        message: "",
        color: "primary",
    });

    const showAlert = (message, title = "Notice", color = "primary") => {
        setAlertDialog({ open: true, title, message, color });
    };

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

    const handleExportExcel = () => {
        const rows = [];

        memberRegistrations.forEach((reg) => {
            // Member row
            rows.push([
                reg.representiveName || '',
                reg.phone || '',
                reg.email || '',
                'Member',
            ]);
        });

        nonMemberRegistrations.forEach((reg) => {
            rows.push([
                reg.representiveName || reg.guestName || '',
                reg.phone || reg.guestPhone || '',
                reg.email || reg.guestEmail || '',
                reg.isGuest ? 'Guest' : 'Non-member',
            ]);
        });

        if (rows.length === 0) {
            showAlert("No data to export", "Notice", "warning");
            return;
        }

        const eventName = selectedEvent?.eventTitle || 'Event';
        const eventDate = formatDate(selectedEvent?.eventDate);

        const worksheet = XLSX.utils.aoa_to_sheet([
            [`Event Name: ${eventName}`, '', `Event Date: ${eventDate}`],
            [],
            ['Name', 'Phone', 'Email', 'Type'],
            ...rows,
        ]);
    
        worksheet['!cols'] = [
            { wch: 35 }, // Name
            { wch: 20 }, // Phone
            { wch: 35 }, // Email
            { wch: 15 }, // Type
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });

        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const safeFileName = (eventName || 'event')
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();

        saveAs(blob, `${safeFileName}_registrations.xlsx`);
    };

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

    const handlePaidSelectChange = (registrationId, value) => {
        const registration = registrations.find(
            (reg) => reg.registrationId === registrationId
        );
        if (registration?.isPaid) return;

        setPaidChanges((prev) => ({
            ...prev,
            [registrationId]: value,
        }));
    };

    const handlePaidUpdate = async (registrationId) => {
        if (!(registrationId in paidChanges)) return;

        const newStatus = paidChanges[registrationId] === "Paid";
        const registration = registrations.find(
            (reg) => reg.registrationId === registrationId
        );
        const targetUserId = registration?.userId || registration?.memberId;
        if (!newStatus || registration?.isPaid) return;

        try {
            setLoadingChanges((prev) => ({ ...prev, [registrationId]: true }));

            const res = await updateRegistrationPaidStatus(registrationId, newStatus);

            if (res.success) {
                if (targetUserId) {
                    await sendNotification(
                        "Payment Confirmed",
                        `Your payment for "${selectedEvent.eventTitle}" has been confirmed.`,
                        [targetUserId]
                    );
                    await createNotification({
                        title: "Payment Confirmed",
                        description: `Your payment for "${selectedEvent.eventTitle}" has been confirmed.`,
                        type: "PAYMENT",
                        referenceId: selectedEvent.eventid || selectedEvent.eventId || selectedEvent.id,
                        userId: targetUserId,
                    });
                }

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

    const isMemberRegistration = (reg) => {
        if (reg.userType?.toUpperCase() === "NON_MEMBER") return false;
        if (reg.userType?.toUpperCase() === "MEMBER") return true;
        if (reg.isNonMember === true || reg.isMember === false || reg.nonMemberId) return false;
        return Boolean(reg.memberId);
    };

    const memberRegistrations = filteredRegistrations.filter(isMemberRegistration);

    const nonMemberRegistrations = [
        ...filteredRegistrations.filter((reg) => !isMemberRegistration(reg)),
        ...filteredRegistrations.flatMap((reg) =>
            (reg.guests || []).map((guest, index) => ({
                ...guest,
                registrationId: `${reg.registrationId}-guest-${guest.guestId || index}`,
                parentRegistrationId: reg.registrationId,
                isGuest: true,
            }))
        ),
    ];

    const renderRegistrationCard = (reg, type) => {
        const paidValue =
            paidChanges[reg.registrationId] ?? (reg.isPaid ? "Paid" : "Not Paid");
        const showUpdateIcon =
            !reg.isGuest &&
            !reg.isPaid &&
            paidChanges[reg.registrationId] &&
            paidChanges[reg.registrationId] !== (reg.isPaid ? "Paid" : "Not Paid");
        const isUpdating = loadingChanges[reg.registrationId] || false;
        const name = reg.representiveName || reg.guestName || reg.name || "-";
        const phone = reg.phone || reg.guestPhone || "-";
        const email = reg.email || reg.guestEmail || "-";

        return (
            <Paper
                key={`${type}-${reg.registrationId}`}
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                        src={
                            reg.companyOrIndividualImage
                                ? `${baseImageURL}${reg.companyOrIndividualImage}`
                                : undefined
                        }
                        alt={name}
                        sx={{ width: 48, height: 48 }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="bold">{name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {phone}
                            {email !== "-" && ` | ${email}`}
                        </Typography>
                        {type === "member" && (
                            <Typography variant="body2" color="textSecondary">
                                <b>Member Included:</b> {reg.isMemberInclude ? "Yes" : "No"}
                            </Typography>
                        )}
                        {reg.isGuest && (
                            <Typography variant="caption" color="text.secondary">
                                Guest of registration #{reg.parentRegistrationId}
                            </Typography>
                        )}
                    </Box>

                    {!reg.isGuest && selectedEvent.feeType === "Paid" && (
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
                                disabled={isUpdating || reg.isPaid}
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
            </Paper>
        );
    };

    return (
        <>
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
                                    <b>Member Fee:</b> {selectedEvent?.eventFee || "Free"}
                                </Typography>
                                <Typography>
                                    <b>Access:</b>{" "}
                                    {selectedEvent?.accessType?.toLowerCase() === "member" ? "Member" : "All"}
                                </Typography>
                                {selectedEvent?.accessType?.toLowerCase() !== "member" && (
                                    <Typography>
                                        <b>Non-member Fee:</b> {selectedEvent?.nonMemberFee || "Free"}
                                    </Typography>
                                )}
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
                                            variant="contained"
                                            onClick={handleExportExcel}
                                        >
                                            Export Excel
                                        </Button>

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

                                {!loading && filteredRegistrations.length > 0 && (
                                    <>
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                                Member Registrations ({memberRegistrations.length})
                                            </Typography>
                                            {memberRegistrations.length > 0 ? (
                                                memberRegistrations.map((reg) => renderRegistrationCard(reg, "member"))
                                            ) : (
                                                <Typography color="text.secondary">No member registrations found.</Typography>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                                                Non-member Registrations ({nonMemberRegistrations.length})
                                            </Typography>
                                            {nonMemberRegistrations.length > 0 ? (
                                                nonMemberRegistrations.map((reg) => renderRegistrationCard(reg, "non-member"))
                                            ) : (
                                                <Typography color="text.secondary">No non-member registrations found.</Typography>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </Paper>
                        </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
            <CommonAlertDialog
                open={alertDialog.open}
                title={alertDialog.title}
                message={alertDialog.message}
                color={alertDialog.color}
                onClose={() => setAlertDialog((prev) => ({ ...prev, open: false }))}
            />
        </>
    );
}
