import React from 'react';
import Box from '@mui/material/Box';

import { ReactComponent as LogoIcon } from '../assets/understood_logo.svg';

const LoadingSpinner = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Box
        sx={{
          width: '100px', // Adjust the size as needed
          height: '100px', // Adjust the size as needed
          animation: 'spin 2s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      >
        <LogoIcon width="100%" height="100%" />
      </Box>
    </Box>
  );
};

export default LoadingSpinner;
