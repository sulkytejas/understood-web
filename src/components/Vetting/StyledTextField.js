import React from 'react';
import { TextField } from '@mui/material';
import styled from '@emotion/styled';

const StyledTextFieldRoot = styled(TextField)(
  ({ responsiveStyles, multiline }) => ({
    borderRadius: multiline ? '15px' : '100px',
    backgroundColor: '#F5F5F5',
    border: 'none',
    // padding: "11px 20px 14px 20px",

    '& .MuiFilledInput-root': {
      backgroundColor: 'transparent',
      textTransform: 'none',
      padding: '0',
    },

    ' & .MuiFilledInput-root:hover': {
      backgroundColor: 'transparent',
    },

    '& .MuiFilledInput-underline:before': {
      borderBottom: 'none', // Removes underline
    },
    '& .MuiFilledInput-underline:after': {
      borderBottom: 'none', // Removes underline on focus
    },
    '& .MuiFilledInput-root:hover:not(.Mui-disabled):before': {
      borderBottom: 'none', // Remove underline on hover
    },

    '& .MuiInputBase-input::placeholder': {
      color: '#5A6D62', // Customize color of placeholder text
      opacity: 1, // Ensures opacity is set as desired
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '22.4px',
      fontFamily: "'Jost', 'sans-serif'",
    },

    '& .MuiFilledInput-input': {
      paddingTop: '11px',
      paddingBottom: '14px',
      paddingLeft: '20px',
      paddingRight: '20px',
      border: 'none',
      textTransform: 'none',
    },

    ...responsiveStyles,
  }),
);

const StyledTextField = ({ responsiveStyles, ...props }) => {
  return (
    <StyledTextFieldRoot
      responsiveStyles={{ ...responsiveStyles }}
      {...props}
      InputProps={{
        disableUnderline: true, // Disables underline completely, including on hover
      }}
      InputLabelProps={{
        sx: {
          transition: 'opacity 0.1s ease', // Smooth transition for disappearing effect

          '&.Mui-focused, &.MuiFormLabel-filled': {
            opacity: 0, // Hide the label on focus or when input has content
          },
        },
      }}
    />
  );
};

export default StyledTextField;
