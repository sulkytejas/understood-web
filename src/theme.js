import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4abcc9', // Customize your primary color
    },
    secondary: {
      main: '#F4C430', // Customize your secondary color
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif', // Customize your typography
  },
  // Add more customizations here if needed
});

export default theme;
