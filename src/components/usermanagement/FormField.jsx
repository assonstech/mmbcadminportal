import { TextField } from '@mui/material';

export const renderField = (
  name,
  label,
  form,
  setForm,
  errors,
  setErrors,
  type = "text",
  fullWidth = true,
  maxLength = null,
  minWidth = 300
) => {
  let value = form[name];

  // Handle null/undefined/false
  if (value === null || value === undefined || value === false) {
    value = "";
  }

  // Handle date: MMDDYYYY → YYYY-MM-DD for input
  if (type === "date" && value && value.length === 8) {
    const mm = value.slice(0, 2);
    const dd = value.slice(2, 4);
    const yyyy = value.slice(4, 8);
    value = `${yyyy}-${mm}-${dd}`;
  }

  return (
    <TextField
      key={name}
      type={type === "number" ? "text" : type} // number stored as string
      label={label}
      value={value}
      fullWidth={fullWidth}
      variant="outlined"
      InputLabelProps={type === "date" ? { shrink: true } : undefined}
      sx={{ minWidth }}
      inputProps={{
        inputMode: type === "number" ? "numeric" : undefined,
        maxLength,
      }}
      onChange={(e) => {
        let val = e.target.value;

        switch (type) {
          case "number":
            // allow only digits, keep as string
            if (!/^\d*$/.test(val)) return;
            break;
          case "date":
            // convert YYYY-MM-DD → MMDDYYYY for backend
            if (val) {
              const [yyyy, mm, dd] = val.split("-");
              val = `${mm}${dd}${yyyy}`;
            }
            break;
          default:
            break; // text, email, tel, password remain as string
        }

        setForm(f => ({ ...f, [name]: val }));
        setErrors(f => ({ ...f, [name]: "" }));
      }}
      error={!!errors[name]}
      helperText={errors[name] || ""}
    />
  );
};
