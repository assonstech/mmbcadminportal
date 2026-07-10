import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SaveIcon from "@mui/icons-material/Save";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { getECMembers, updateOrgChartSort } from "../controllers/MemberController";
import { baseImageURL } from "../config/api";
import CommonAlertDialog from "../components/CommonAlertDialog";

const ORG_ROWS = [
    { key: "PRESIDENT", title: "President", subtitle: "President Row", icon: <WorkspacePremiumIcon /> },
    { key: "BOD", title: "BOD", subtitle: "BOD Row", icon: <GroupsIcon /> },
    { key: "EC", title: "EC", subtitle: "EC Row", icon: <AccountTreeIcon /> },
];

const groupMembersByRow = (members) => {
    const grouped = ORG_ROWS.reduce((acc, row) => ({ ...acc, [row.key]: [] }), {});

    members.forEach((member) => {
        const row = String(member.orgChartRow || "").toUpperCase();
        if (grouped[row]) grouped[row].push(member);
    });

    ORG_ROWS.forEach((row) => {
        grouped[row.key].sort((a, b) => {
            const sortA = Number(a.orgChartSortOrder) || 9999;
            const sortB = Number(b.orgChartSortOrder) || 9999;
            return sortA - sortB || Number(a.memberId) - Number(b.memberId);
        });
    });

    return grouped;
};

export default function OrganizationChartPage() {
    const [rows, setRows] = useState(() => groupMembersByRow([]));
    const [originalRows, setOriginalRows] = useState(() => groupMembersByRow([]));
    const [loading, setLoading] = useState(true);
    const [savingRow, setSavingRow] = useState("");
    const [activeTab, setActiveTab] = useState("PRESIDENT");
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        title: "Notice",
        message: "",
        color: "primary",
    });

    const showAlert = (message, title = "Notice", color = "primary") => {
        setAlertDialog({ open: true, title, message, color });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const members = await getECMembers();
            const grouped = groupMembersByRow(Array.isArray(members) ? members : []);
            setRows(grouped);
            setOriginalRows(grouped);
        } catch (err) {
            console.error("Error fetching organization chart:", err);
            showAlert("Failed to fetch organization chart members", "Error", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const rowDirtyState = useMemo(() => {
        return ORG_ROWS.reduce((acc, row) => {
            const current = rows[row.key].map((member) => member.memberId).join(",");
            const original = originalRows[row.key].map((member) => member.memberId).join(",");
            acc[row.key] = current !== original;
            return acc;
        }, {});
    }, [rows, originalRows]);

    const activeRow = useMemo(
        () => ORG_ROWS.find((row) => row.key === activeTab) || ORG_ROWS[0],
        [activeTab]
    );
    const activeMembers = rows[activeRow.key] || [];
    const activeRowDirty = rowDirtyState[activeRow.key];

    const moveMember = (rowKey, index, direction) => {
        setRows((prev) => {
            const rowMembers = [...prev[rowKey]];
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= rowMembers.length) return prev;

            [rowMembers[index], rowMembers[nextIndex]] = [rowMembers[nextIndex], rowMembers[index]];

            return {
                ...prev,
                [rowKey]: rowMembers,
            };
        });
    };

    const saveRow = async (rowKey) => {
        try {
            setSavingRow(rowKey);
            const memberIds = rows[rowKey].map((member) => member.memberId);
            const res = await updateOrgChartSort(rowKey, memberIds);

            if (!res?.success) {
                showAlert(res?.message || "Failed to save organization chart order", "Error", "error");
                return;
            }

            setOriginalRows((prev) => ({
                ...prev,
                [rowKey]: rows[rowKey],
            }));
            showAlert("Organization chart order updated successfully", "Success", "success");
        } catch (err) {
            console.error("Error saving organization chart order:", err);
            showAlert("Failed to save organization chart order", "Error", "error");
        } finally {
            setSavingRow("");
        }
    };

    const renderMember = (member, index, rowKey, total) => (
        <Paper
            key={member.memberId}
            variant="outlined"
            sx={{
                px: { xs: 1.5, md: 2 },
                py: 1.5,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                minHeight: 84,
                bgcolor: "#fff",
                borderColor: "#e1e5ee",
                transition: "border-color 160ms ease, box-shadow 160ms ease",
                "&:hover": {
                    borderColor: "#93a3bf",
                    boxShadow: "0 8px 24px rgba(15, 35, 75, 0.08)",
                },
            }}
        >
            <Avatar
                src={member.companyOrIndividualImage ? `${baseImageURL}${member.companyOrIndividualImage}` : ""}
                sx={{ width: 52, height: 52, bgcolor: "#102b61", flexShrink: 0 }}
            >
                {(member.representiveName || "M").charAt(0)}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={700} noWrap>
                    {member.representiveName || "Unnamed Member"}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {member.ecPosition || "-"}
                </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
                <IconButton
                    aria-label="Move up"
                    onClick={() => moveMember(rowKey, index, -1)}
                    disabled={index === 0 || Boolean(savingRow)}
                    size="small"
                >
                    <KeyboardArrowUpIcon />
                </IconButton>
                <IconButton
                    aria-label="Move down"
                    onClick={() => moveMember(rowKey, index, 1)}
                    disabled={index === total - 1 || Boolean(savingRow)}
                    size="small"
                >
                    <KeyboardArrowDownIcon />
                </IconButton>
            </Stack>
        </Paper>
    );

    return (
        <Box sx={{ p: 3, bgcolor: "#f6f7fb", minHeight: "100vh" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>
                        Org Chart
                    </Typography>
                    <Typography color="text.secondary">
                        Manage President, BOD, and EC row display order.
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={fetchData} disabled={loading || Boolean(savingRow)}>
                    Refresh
                </Button>
            </Stack>

            <Paper
                sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid #e3e7ef",
                    boxShadow: "0 8px 24px rgba(18, 35, 65, 0.06)",
                }}
            >
                <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 2, bgcolor: "#fff" }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, value) => setActiveTab(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            minHeight: 54,
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: 3,
                                bgcolor: "#102b61",
                            },
                            "& .MuiTab-root": {
                                minHeight: 54,
                                textTransform: "none",
                                alignItems: "center",
                                color: "text.secondary",
                                fontWeight: 700,
                                mr: 1,
                                borderRadius: "8px 8px 0 0",
                            },
                            "& .Mui-selected": {
                                color: "#102b61",
                                bgcolor: "#f3f6fb",
                            },
                        }}
                    >
                        {ORG_ROWS.map((row) => {
                            const count = rows[row.key]?.length || 0;
                            const dirty = rowDirtyState[row.key];

                            return (
                                <Tab
                                    key={row.key}
                                    value={row.key}
                                    icon={row.icon}
                                    iconPosition="start"
                                    label={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <span>{row.title}</span>
                                            <Chip
                                                label={count}
                                                size="small"
                                                color={dirty ? "warning" : "default"}
                                                sx={{ height: 22, minWidth: 28, fontWeight: 700 }}
                                            />
                                        </Stack>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Box>

                <Divider />

                {loading ? (
                    <Box sx={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            justifyContent="space-between"
                            spacing={2}
                            sx={{
                                px: { xs: 2, md: 3 },
                                py: 2.5,
                                bgcolor: "#f8faff",
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Box
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 2,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "#102b61",
                                        color: "#fff",
                                        "& svg": { fontSize: 24 },
                                    }}
                                >
                                    {activeRow.icon}
                                </Box>
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="h6" fontWeight={800}>
                                            {activeRow.subtitle}
                                        </Typography>
                                        {activeRowDirty && (
                                            <Chip
                                                label="Unsaved"
                                                color="warning"
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {activeMembers.length} member{activeMembers.length === 1 ? "" : "s"}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                variant="contained"
                                startIcon={savingRow === activeRow.key ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                disabled={!activeRowDirty || Boolean(savingRow)}
                                onClick={() => saveRow(activeRow.key)}
                                sx={{
                                    minHeight: 44,
                                    borderRadius: 2,
                                    bgcolor: "#102b61",
                                    "&:hover": { bgcolor: "#0d2452" },
                                }}
                            >
                                Save Order
                            </Button>
                        </Stack>

                        <Divider />

                        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fff" }}>
                            {activeMembers.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px dashed #c9d2e3",
                                        borderRadius: 2,
                                        bgcolor: "#fbfcff",
                                    }}
                                >
                                    <Typography color="text.secondary">
                                        No members in this row.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {activeMembers.map((member, index) => renderMember(member, index, activeRow.key, activeMembers.length))}
                                </Stack>
                            )}
                        </Box>
                    </>
                )}
            </Paper>

            <CommonAlertDialog
                open={alertDialog.open}
                title={alertDialog.title}
                message={alertDialog.message}
                color={alertDialog.color}
                onClose={() => setAlertDialog((prev) => ({ ...prev, open: false }))}
            />
        </Box>
    );
}
