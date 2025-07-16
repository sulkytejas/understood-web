import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, FormHelperText } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { OtpTitle, OtpSubtitle } from './Login.styles';
import { OtpTextInput } from '../ui';

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
}) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);
  const { t } = useTranslation();

  useEffect(() => {
    setOtp(new Array(length).fill(''));
    inputRefs.current[0].focus();
  }, [isOtpInvalid]);

  const handleChange = useCallback(
    (element, index) => {
      const value = element.value.replace(/[^0-9]/g, '');
      if (value) {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        onSetOtp(newOtp.join(''));

        if (index < length - 1) {
          inputRefs.current[index + 1].focus();
        }
      }
    },
    [otp, length, onSetOtp],
  );

  const handleKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'Backspace') {
        const newOtp = [...otp];

        if (otp[index] === '') {
          if (index > 0) {
            inputRefs.current[index - 1].focus();
          }
        } else {
          newOtp[index] = '';
          setOtp(newOtp);
          onSetOtp(newOtp.join(''));
        }
      }
    },
    [otp, onSetOtp],
  );

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <OtpTitle>{t('Verify your number')}</OtpTitle>
      <OtpSubtitle>
        {t('Enter OTP sent to ')}
        <span style={{ color: '#DF4303' }}>{phoneNumber}</span>
      </OtpSubtitle>

      <Box display="flex" flexDirection="column" justifyContent="space-between">
        <Box display="flex" justifyContent="space-between" width="100%">
          {otp.map((data, index) => (
            <OtpTextInput
              key={index}
              value={data}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 1,
              }}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              inputRef={(ref) => (inputRefs.current[index] = ref)}
              variant="outlined"
              sx={{ flex: 1, margin: '5px' }}
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

export default React.memo(OtpVerification);
