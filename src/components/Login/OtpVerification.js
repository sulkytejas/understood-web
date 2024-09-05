import React, { useState, useRef } from 'react';
import { TextField, Box, Typography } from '@mui/material';

const OtpVerification = ({ onSetOtp, length = 6, phoneNumber }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      onSetOtp(newOtp.join(''));

      if (index < length - 1) {
        inputRefs.current[index + 1].focus(); // Move to the next box
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '') {
      if (index > 0) {
        inputRefs.current[index - 1].focus(); // Move to the previous box
      }
    }
  };

  return (
    <div>
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: '23px',
          lineHeight: '37px',
          marginTop: '90px',
          color: '#DF4303',
        }}
      >
        Verify your number
      </Typography>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '15px',
          lineHeight: '22px',
          color: '#595959',
          marginBottom: '70px',
        }}
      >
        Enter OTP sent to{' '}
        <span style={{ color: '#DF4303' }}>{phoneNumber}</span>
      </Typography>

      <Box display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" justifyContent="space-between" width="100%">
          {otp.map((data, index) => (
            <TextField
              key={index}
              value={data}
              inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              inputRef={(ref) => (inputRefs.current[index] = ref)}
              variant="outlined"
              style={{
                flex: 1,
                margin: '5px',
                backgroundColor: '#f5f5f5',
              }}
            />
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default OtpVerification;
