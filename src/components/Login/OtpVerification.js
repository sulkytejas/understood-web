import React, { useState, useRef, useEffect } from 'react';
import { TextField, Box, Typography, FormHelperText } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};
const pageTransition = {
  duration: 0.3,
};

const OtpVerification = ({
  onSetOtp,
  length = 6,
  phoneNumber,
  isOtpInvalid,
  setLoading,
}) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);
  const { t } = useTranslation();

  useEffect(() => {
    setOtp(new Array(length).fill(''));
    inputRefs.current[0].focus();
  }, [isOtpInvalid]);

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setLoading(true);
      onSetOtp(newOtp.join(''));

      if (index < length - 1) {
        inputRefs.current[index + 1].focus(); // Move to the next box
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];

      if (otp[index] === '') {
        if (index > 0) {
          inputRefs.current[index - 1].focus(); // Move to the previous box
        }
      } else {
        newOtp[index] = ''; // Clear the current box
        setOtp(newOtp);
        onSetOtp(newOtp.join(''));
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Typography
        sx={{
          fontWeight: 400,
          fontSize: '23px',
          lineHeight: '37px',
          marginTop: '30px',
          color: '#DF4303',
        }}
      >
        {t('Verify your number')}
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
        {t('Enter OTP sent to ')}
        <span style={{ color: '#DF4303' }}>{phoneNumber}</span>
      </Typography>

      <Box display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" justifyContent="space-between" width="100%">
          {otp.map((data, index) => (
            <TextField
              key={index}
              value={data}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 1,
                style: { textAlign: 'center' },
              }}
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
        {isOtpInvalid && (
          <FormHelperText>{t('Invalid OTP. Please try again.')}</FormHelperText>
        )}
      </Box>
    </motion.div>
  );
};

export default OtpVerification;
