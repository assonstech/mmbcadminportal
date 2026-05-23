import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { getNonMembers } from "../controllers/MemberController";

const getRowsFromResponse = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.nonMembers)) return res.data.nonMembers;
  if (Array.isArray(res?.data?.members)) return res.data.members;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const getPaginationFromResponse = (res, rows, page, limit) => {
  const pagination = res?.pagination || res?.data?.pagination || res?.meta || {};
  const totalCount = pagination.totalCount ?? pagination.total ?? pagination.count ?? rows.length;
  const totalPages = pagination.totalPages
    ?? pagination.pages
    ?? (pagination.totalCount || pagination.total
      ? Math.ceil(totalCount / limit)
      : rows.length === limit
        ? page + 1
        : page);

  return {
    page: pagination.page || page,
    limit: pagination.limit || pagination.pageSize || limit,
    totalCount,
    totalPages,
  };
};

const columns = [
  {
    field: "representiveName",
    headerName: "Name",
    flex: 1,
    minWidth: 220,
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography fontWeight={700}>{params.value || "-"}</Typography>
      </Box>
    ),
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1,
    minWidth: 220,
  },
  {
    field: "phone",
    headerName: "Phone",
    flex: 1,
    minWidth: 160,
  },
];

export default function NonMemberPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchNonMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNonMembers(page, limit, search);
      if (res?.success) {
        const apiRows = getRowsFromResponse(res);
        setRows(apiRows.map((row, index) => ({
          ...row,
          _rowId: row.nonMemberId
            || row.id
            || row.registrationId
            || row.guestId
            || row.email
            || row.nonMemberEmail
            || `${page}-${index}`,
        })));
        setPagination(getPaginationFromResponse(res, apiRows, page, limit));
      } else {
        setRows([]);
        setPagination({ page, limit, totalCount: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch non-members:", err);
      setRows([]);
      setPagination({ page, limit, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchNonMembers();
  }, [fetchNonMembers]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>Non-Members</Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Search non-members"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            sx={{ minWidth: { sm: 280 } }}
          />
          <Button variant="outlined" onClick={handleSearch} disabled={loading}>
            Search
          </Button>
          <Button variant="text" onClick={handleReset} disabled={loading || (!searchInput && !search)}>
            Reset
          </Button>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="non-member-limit-label">Limit</InputLabel>
            <Select
              labelId="non-member-limit-label"
              value={limit}
              label="Limit"
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50].map((value) => (
                <MenuItem key={value} value={value}>{value}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Paper sx={{ width: "100%" }}>
        <Box sx={{ height: 560, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row._rowId}
            loading={loading}
            disableRowSelectionOnClick
            hideFooterPagination
          />
        </Box>
      </Paper>

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
          {" "} | Total: {pagination.totalCount} non-members
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={loading || page >= Math.max(pagination.totalPages || 1, 1)}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}
