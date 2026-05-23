import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getPartnerScanLogs } from '../controllers/PartnerScanController';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function MemberVisitLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [partnerTypeInput, setPartnerTypeInput] = useState('');
  const [partnerType, setPartnerType] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPartnerScanLogs({
        page,
        limit,
        partnerType,
      });

      if (res?.success) {
        const data = res.data || {};
        setRows(Array.isArray(data.scans) ? data.scans : []);
        setPagination({
          page: data.page || page,
          limit: data.limit || limit,
          total: data.total || 0,
          totalPages: data.totalPages || 1,
        });
      } else {
        setRows([]);
        setPagination({ page, limit, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('fetch member visit logs error:', err);
      setRows([]);
      setPagination({ page, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, partnerType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilters = () => {
    setPage(1);
    setPartnerType(partnerTypeInput.trim());
  };

  const resetFilters = () => {
    setPartnerTypeInput('');
    setPartnerType('');
    setPage(1);
  };

  const columns = [
    { field: 'memberCode', headerName: 'Member Code', flex: 1, minWidth: 160 },
    { field: 'representiveName', headerName: 'Representative Name', flex: 1.5, minWidth: 240 },
    { field: 'partnerType', headerName: 'Partner Type', flex: 1, minWidth: 180 },
    {
      field: 'arrivedAt',
      headerName: 'Arrived Time',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => formatDateTime(params.value),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>Member Visit Logs</Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            label="Partner Type"
            size="small"
            value={partnerTypeInput}
            onChange={(e) => setPartnerTypeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters();
            }}
            sx={{ minWidth: { md: 180 } }}
          />
          <Button variant="outlined" onClick={applyFilters} disabled={loading}>
            Search
          </Button>
          <Button
            variant="text"
            onClick={resetFilters}
            disabled={loading || (!partnerTypeInput && !partnerType)}
          >
            Reset
          </Button>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="visit-log-limit-label">Limit</InputLabel>
            <Select
              labelId="visit-log-limit-label"
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

      <Box sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.scanId}
          loading={loading}
          disableRowSelectionOnClick
          hideFooterPagination
        />
      </Box>

      <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => setPage((prev) => prev - 1)}
          disabled={loading || page <= 1}
        >
          Previous
        </Button>
        <Typography variant="body2">
          Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
          {' '}| Total: {pagination.total} visits
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
