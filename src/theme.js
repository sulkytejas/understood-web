import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#4abcc9', // Customize your primary color
    },
    secondary: {
      main: '#F4C430', // Customize your secondary color
    },
  },
  typography: {
    fontFamily: '"Exo 2", serif !important', // Customize your typography
  },
  // Add more customizations here if needed
});

export default theme;
