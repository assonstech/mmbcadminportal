import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#122858' },
    secondary: { main: '#536ca5ff' },
    background: { default: '#fafafa' },
  },
  shape: { borderRadius: 12 },
});
