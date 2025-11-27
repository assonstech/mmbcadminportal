import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Grid, TextField, MenuItem } from '@mui/material';
import { getTownshipsByCode } from '../../controllers/MemberController';

const NrcField = forwardRef(({ form, setForm, nrcTypes,title }, ref) => {
  const [nrcTownships, setNrcTownships] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedTownship, setSelectedTownship] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [nrcNumber, setNrcNumber] = useState('');

  const [errors, setErrors] = useState({}); // internal errors

  // Parse form.memberNRC when editing
  useEffect(() => {
    if (!form?.memberNRC) return;
    const match = String(form.memberNRC).match(/^(\d{1,2})\/([^()]+)\(([^)]+)\)(\d{6})$/i);
    if (match) {
      setSelectedState(match[1] || '');
      setSelectedTownship((match[2] || '').trim());
      setSelectedType((match[3] || '').trim());
      setNrcNumber(match[4] || '');
    }
  }, [form?.memberNRC]);

  // Fetch townships when state changes
  useEffect(() => {
    if (!selectedState) {
      setNrcTownships([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await getTownshipsByCode(selectedState);
        if (mounted) {
          const sorted = Array.isArray(data)
            ? [...data].sort((a, b) =>
              a.shortEn.localeCompare(b.shortEn)
            )
            : [];
          setNrcTownships(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch townships", err);
        if (mounted) setNrcTownships([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedState]);


  // Update parent form.memberNRC
  useEffect(() => {
    const memberNRC =
      selectedState && selectedTownship && selectedType && nrcNumber
        ? `${selectedState}/${selectedTownship}(${selectedType})${nrcNumber}`
        : '';
    setForm(f => ({ ...f, memberNRC }));
  }, [selectedState, selectedTownship, selectedType, nrcNumber, setForm]);

  // Validation function, returns errors
  const validateFields = () => {
    const tempErrors = {};
    if (!selectedState) tempErrors.state = 'State/Region is required';
    if (!selectedTownship) tempErrors.township = 'Township is required';
    if (!selectedType) tempErrors.type = 'NRC Type is required';
    if (!nrcNumber) tempErrors.number = 'Citizen Number is required';
    else if (nrcNumber.length !== 6) tempErrors.number = 'Citizen Number must be 6 digits';

    setErrors(tempErrors);
    return tempErrors;
  };

  // Expose validation to parent using ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      const errs = validateFields();
      return Object.keys(errs).length === 0; // true if valid, false if errors
    }
  }));

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
        {title}
      </Typography>

      <Grid container spacing={2}>
        {/* State / Region */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="State/Region"
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setSelectedTownship(''); setErrors(prev => ({ ...prev, state: '' })); }}
            fullWidth
            error={Boolean(errors.state)}
            helperText={errors.state || ''}
            sx={{ minWidth: 150 }}
          >
            {Array.from({ length: 14 }, (_, i) => i + 1).map(num => (
              <MenuItem key={num} value={String(num)}>{num}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Township */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="Township"
            value={selectedTownship}
            onChange={(e) => { setSelectedTownship(e.target.value); setErrors(prev => ({ ...prev, township: '' })); }}
            fullWidth
            error={Boolean(errors.township)}
            helperText={errors.township || ''}
            sx={{ minWidth: 120 }}

          >
            {nrcTownships.map(item => (
              <MenuItem key={item.id || item.shortEn} value={item.shortEn}>{item.shortEn}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* NRC Type */}
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="NRC Type"
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setErrors(prev => ({ ...prev, type: '' })); }}
            fullWidth
            error={Boolean(errors.type)}
            helperText={errors.type || ''}
            sx={{ minWidth: 120 }}

          >
            {Array.isArray(nrcTypes) ? nrcTypes.map(item => (
              <MenuItem key={item.id || item.codeEn} value={item.codeEn}>{item.codeEn}</MenuItem>
            )) : null}
          </TextField>
        </Grid>

        {/* Citizen Number */}
        <Grid item xs={12} md={6}>
          <TextField
            type="text"
            label="Citizen Number"
            value={nrcNumber}
            onChange={(e) => {
              const digits = String(e.target.value || '').replace(/\D/g, '').slice(0, 6);
              setNrcNumber(digits);
              setErrors(prev => ({ ...prev, number: '' }));
            }}
            error={Boolean(errors.number)}
            helperText={errors.number || ''}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

export default NrcField;
