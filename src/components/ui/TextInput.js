import React, { forwardRef } from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

// Base styled TextField that can be extended
const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => !['styleVariant'].includes(prop),
})(({ styleVariant }) => ({
  // Base styles
  '& .MuiInputBase-root': {
    fontSize: '16px',
    lineHeight: '22px',
    fontFamily: 'Exo 2, sans-serif',
  },

  // Variant-specific styles
  ...(styleVariant === 'login' && {
    '& .MuiInputBase-root': {
      backgroundColor: '#F9F9F9',
      borderRadius: '0px',
      '&:before': {
        borderBottom: '1px solid #A8A8A8',
      },
      '&:hover:not(.Mui-disabled):before': {
        borderBottom: '1px solid #000',
      },
      '&.Mui-focused:after': {
        borderBottom: '2px solid #DF4303',
      },
    },
    '& .MuiInputBase-input': {
      padding: '12px 14px',
      color: '#000000',
      '&::placeholder': {
        color: '#595959',
        opacity: 0.8,
      },
    },
  }),

  ...(styleVariant === 'filled' && {
    '& .MuiInputBase-root': {
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: '#ebebeb',
      },
      '&.Mui-focused': {
        backgroundColor: '#e0e0e0',
      },
    },
  }),

  ...(styleVariant === 'outlined' && {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#A8A8A8',
      },
      '&:hover fieldset': {
        borderColor: '#000',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#DF4303',
      },
    },
  }),
}));

const TextInput = forwardRef(
  (
    {
      styleVariant = 'standard',
      error,
      helperText,
      fullWidth = true,
      InputProps = {},
      inputProps = {},
      sx = {},
      ...props
    },
    ref,
  ) => {
    return (
      <StyledTextField
        ref={ref}
        fullWidth={fullWidth}
        error={error}
        helperText={helperText}
        styleVariant={styleVariant}
        variant={styleVariant === 'outlined' ? 'outlined' : 'standard'}
        InputProps={{
          ...InputProps,
          ...(styleVariant === 'filled' && { disableUnderline: true }),
        }}
        inputProps={{
          ...inputProps,
        }}
        sx={{
          ...sx,
        }}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

export default TextInput;
