import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { TextInput, OtpTextInput, createStyledTextInput } from './index';

// Example of custom styled TextInput
const CustomStyledInput = createStyledTextInput({
  '& .MuiInputBase-root': {
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: '#bbdefb',
    },
  },
});

function TextInputExamples() {
  const [values, setValues] = useState({
    standard: '',
    login: '',
    outlined: '',
    filled: '',
    otp: '',
    custom: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setValues({ ...values, [field]: event.target.value });

    // Example validation
    if (
      field === 'otp' &&
      event.target.value &&
      !/^\d+$/.test(event.target.value)
    ) {
      setErrors({ ...errors, [field]: 'Only numbers allowed' });
    } else {
      setErrors({ ...errors, [field]: null });
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        TextInput Component Examples
      </Typography>

      {/* Basic TextInput */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Basic TextInput</Typography>
        <TextInput
          label="Standard Input"
          value={values.standard}
          onChange={handleChange('standard')}
          placeholder="Enter text..."
        />
      </Box>

      {/* Login Style */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Login Style</Typography>
        <TextInput
          styleVariant="login"
          label="Email"
          value={values.login}
          onChange={handleChange('login')}
          placeholder="your@email.com"
        />
      </Box>

      {/* Outlined Variant */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Outlined Variant</Typography>
        <TextInput
          styleVariant="outlined"
          label="Outlined Input"
          value={values.outlined}
          onChange={handleChange('outlined')}
          placeholder="Enter text..."
        />
      </Box>

      {/* Filled Variant */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Filled Variant</Typography>
        <TextInput
          styleVariant="filled"
          label="Filled Input"
          value={values.filled}
          onChange={handleChange('filled')}
          placeholder="Enter text..."
        />
      </Box>

      {/* OTP Input with Validation */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">OTP Input (Pre-styled)</Typography>
        <OtpTextInput
          label="Enter OTP"
          value={values.otp}
          onChange={handleChange('otp')}
          error={!!errors.otp}
          helperText={errors.otp}
          placeholder="123456"
          inputProps={{ maxLength: 6 }}
        />
      </Box>

      {/* Custom Styled */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Custom Styled</Typography>
        <CustomStyledInput
          label="Custom Styled Input"
          value={values.custom}
          onChange={handleChange('custom')}
          placeholder="Beautiful custom input..."
        />
      </Box>

      {/* With Custom sx prop */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">With sx prop styling</Typography>
        <TextInput
          label="Custom sx styling"
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: '#f0f0f0',
              borderRadius: '12px',
            },
          }}
          placeholder="Styled with sx prop..."
        />
      </Box>

      {/* Disabled State */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Disabled State</Typography>
        <TextInput label="Disabled Input" value="This is disabled" disabled />
      </Box>
    </Box>
  );
}

export default TextInputExamples;
