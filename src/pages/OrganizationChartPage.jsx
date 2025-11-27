import React, { useEffect, useRef, useState } from "react";
import { OrgChart } from "d3-org-chart";
import * as d3 from "d3";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormControl, InputLabel, Select, MenuItem, Typography,
    Avatar, Box, CircularProgress,
} from "@mui/material";
import { getECMembers, updateParentMemberId } from "../controllers/MemberController";
import api, { baseImageURL } from "../config/api";

export default function OrganizationChartPage() {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editNodeId, setEditNodeId] = useState(null);
    const [parentIdValue, setParentIdValue] = useState("");
    const [saving, setSaving] = useState(false);
    const lastRequestId = useRef(0);

    // Transform API → OrgChart format
    const transformData = (ceoData, ecMembers) => {
        // Find the CEO in the member list
        const ceoMember = ecMembers.find(member => member.memberId === ceoData.memberId);

        // CEO node using name and image from member list
        const ceoId = `${ceoData.memberId}`;
        const ceoNode = {
            id: ceoId,
            parentId: null,
            name: ceoMember?.representiveName || "CEO",
            title: ceoMember?.ecPosition || "CEO",
            image: ceoMember?.companyOrIndividualImage
                ? `${baseImageURL}${ceoMember.companyOrIndividualImage}`
                : "https://i.pravatar.cc/100",
        };

        // Secretaries always under CEO
        const secretaryNodes = (ceoData.Secretaries || []).map((sec, index) => ({
            id: `sec-${index}`,
            parentId: ceoId,
            name: sec.name,
            title: "Secretary",
            image: sec.photoPath ? `${baseImageURL}${sec.photoPath}` : "https://i.pravatar.cc/100",
            isSecretary: true,
        }));

        // EC Members: exclude CEO from EC list to avoid duplication
        const ecNodes = (ecMembers || [])
            .filter(item => item.memberId !== ceoData.memberId)
            .map(item => ({
                id: `${item.memberId}`,
                parentId: (!item.parentMemberId || item.parentMemberId === ceoData.memberId)
                    ? ceoId
                    : `${item.parentMemberId}`,
                name: item.representiveName || "Unnamed Member",
                title: item.ecPosition || "Member",
                image: item.companyOrIndividualImage
                    ? `${baseImageURL}${item.companyOrIndividualImage}`
                    : "https://i.pravatar.cc/100",
            }));

        return [ceoNode, ...ecNodes, ...secretaryNodes];
    };



    // Get descendants for cycle check
    const getDescendants = (nodeId, nodes) => {
        const children = nodes.filter(n => n.parentId === nodeId);
        return children.reduce((acc, child) => [...acc, child.id, ...getDescendants(child.id, nodes)], []);
    };

    // Render OrgChart
    const renderChart = chartData => {
        if (!chartRef.current) return;
        chartRef.current.innerHTML = "";

        const chart = new OrgChart()
            .container(chartRef.current)
            .data(chartData)
            .nodeWidth(() => 220)
            .nodeHeight(() => 120)
            .childrenMargin(() => 50)
            .compactMarginBetween(() => 20)
            .duration(600)
            .nodeContent(d => `
                <div style="display:flex; align-items:center; padding:15px; border-radius:15px; border:3px solid #1976d2; background:linear-gradient(145deg,#e3f2fd,#bbdefb); box-shadow:3px 3px 15px rgba(0,0,0,0.15); cursor:pointer;">
                    <img src="${d.data.image}" style="width:60px; height:60px; border-radius:50%; border:2px solid #1976d2; margin-right:15px;" />
                    <div>
                        <div style="font-weight:bold;font-size:16px;color:#0d1b2a;">${d.data.name}</div>
                        <div style="font-size:14px;color:#555;">${d.data.title}</div>
                    </div>
                </div>
            `)
            .onNodeClick(d => {
                if (d.data.isSecretary) return; // Secretaries cannot be editedƒM
                setEditNodeId(d.data.id);
                setParentIdValue(d.data.parentId || "");
            })
            .linkUpdate(function () {
                d3.select(this).attr("stroke", "#1976d2").attr("stroke-width", 2);
            });

        chartInstance.current = chart;
        chart.render();
    };


    // Fetch CEO + EC Members
    const fetchData = async () => {
        const requestId = ++lastRequestId.current;
        try {
            setLoading(true);

            // Fetch CEO
            const ceoRes = await api.get('/ceo-data');
            const ceoData = ceoRes.data;

            // Fetch EC Members
            const ecRes = await getECMembers();
            const ecMembers = ecRes.data || ecRes; // adjust if getECMembers returns data differently

            if (lastRequestId.current !== requestId) return;

            const formatted = transformData(ceoData, ecMembers);
            setData(formatted);
            setTimeout(() => renderChart(formatted), 100);

        } catch (err) {
            console.error("Error fetching data:", err.message || err);
        } finally {
            if (lastRequestId.current === requestId) setLoading(false);
        }
    };


    useEffect(() => { fetchData(); }, []);

    // Handle Save parent change
    const handleSave = async () => {
        if (!parentIdValue && data.filter(n => n.parentId === null && n.id !== editNodeId).length > 0) {
            alert("Cannot create multiple root nodes!");
            return;
        }

        const descendants = getDescendants(editNodeId, data);
        if (descendants.includes(parentIdValue)) {
            alert("Cannot set a descendant as parent!");
            return;
        }

        try {
            setSaving(true);
            const res = await updateParentMemberId(editNodeId, parentIdValue || null);

            if (res && res.success) {
                const updated = data.map(node =>
                    node.id === editNodeId ? { ...node, parentId: parentIdValue || null } : node
                );

                setData(updated);
                chartInstance.current?.data(updated).render();
                setEditNodeId(null);
                setParentIdValue("");
            } else {
                alert("Failed to update parent. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving parent. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setEditNodeId(null); setParentIdValue(""); };
    const editingNode = data.find(n => n.id === editNodeId);
    const descendants = editNodeId ? getDescendants(editNodeId, data) : [];

    return (
        <Box sx={{ width: "100%", height: "100vh", p: 3, background: "#f0f2f5" }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom sx={{ color: "#1976d2", mb: 3 }}>
                MMBC Organization Chart ({data.length === 0 ? "..." : data.length} members)
            </Typography>

            {loading ? (
                <Box sx={{ width: "100%", height: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress color="primary" size={60} />
                </Box>
            ) : (
                <div ref={chartRef} style={{ width: "100%", height: "85vh", borderRadius: "12px", overflow: "auto" }} />
            )}

            {/* Edit Dialog */}
            <Dialog open={Boolean(editNodeId)} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Node Parent</DialogTitle>
                <DialogContent dividers sx={{ position: 'relative' }}>
                    {saving && (
                        <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", bgcolor: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "inherit" }}>
                            <CircularProgress size={50} />
                        </Box>
                    )}

                    {editingNode && (
                        <Box display="flex" alignItems="center" mb={3}>
                            <Avatar src={editingNode.image} sx={{ width: 60, height: 60, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">{editingNode.name}</Typography>
                                <Typography variant="body2" color="textSecondary">{editingNode.title}</Typography>
                            </Box>
                        </Box>
                    )}

                    <FormControl fullWidth>
                        <InputLabel>Parent</InputLabel>
                        <Select
                            label="Parent"
                            value={parentIdValue}
                            onChange={e => setParentIdValue(e.target.value)}
                            disabled={saving}
                        >
                            {data
                                .filter(node => node.id !== editNodeId && !descendants.includes(node.id) && !node.isSecretary)
                                .map(node => (
                                    <MenuItem key={node.id} value={node.id}>{node.name}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} color="inherit" disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
                        {saving ? <CircularProgress size={24} color="inherit" /> : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
