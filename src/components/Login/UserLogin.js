import React, { useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import GoogleAuthentication from './GoogleAuthentication';
import PhoneSignIn from './PhoneSignIn';
import SignUpModal from './SignUpModal';
import { styled } from '@mui/material/styles';
import { ReactComponent as LogoIcon } from '../assets/understood_logo.svg';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const BackgroundLogo = styled(Box)(() => ({
  position: 'absolute ',
  right: 0,
  transform: 'translate(0%)',
  height: '100%',
  overflow: 'hidden',
  opacity: 0.06,

  '& svg': {
    width: '106%', // Make the SVG twice as wide
    height: '100%',
    position: 'relative',
    left: '-46%', // Shift the SVG to the left to show only the left half
  },
}));

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};
const pageTransition = {
  duration: 0.3,
};

const UserLogin = () => {
  const [loginMethod, setLoginMethod] = useState(null);
  const { t } = useTranslation();
  const [isPhoneNumberSubmitted, setIsPhoneNumberSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const phoneLoginRef = useRef(null);

  const handleButtonClick = (e) => {
    e.preventDefault();
    if (phoneLoginRef.current) {
      if (!isPhoneNumberSubmitted) {
        phoneLoginRef.current.sendOTP();
      } else {
        phoneLoginRef.current.verifyOTP();
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Box
        sx={{
          margin: '16px',
        }}
      >
        {/* Background logo */}
        <BackgroundLogo>
          <LogoIcon />
        </BackgroundLogo>

        {!isPhoneNumberSubmitted && (
          <div>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '32px',
                lineHeight: '48px',
                marginTop: '90px',
                color: '#DF4303',
              }}
            >
              {t('Welcome Back, Globe-Trotter!')}
            </Typography>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '22px',
                color: '#595959',
              }}
            >
              {t('Let’s get you talking—no passports needed.')}
            </Typography>
          </div>
        )}
        {loginMethod !== 'googleLogin' && (
          <PhoneSignIn
            onLogin={setLoginMethod}
            onSetIsPhoneNumberSubmitted={setIsPhoneNumberSubmitted}
            ref={phoneLoginRef}
          />
        )}

        {!loginMethod && (
          <Typography
            sx={{
              textAlign: 'center',
              color: '#595959',
              margin: '40px 0',
            }}
          >
            {t(' or')}
          </Typography>
        )}

        {loginMethod !== 'phoneLogin' && (
          <GoogleAuthentication onLogin={setLoginMethod} />
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          className="create-invite-button"
          onClick={handleButtonClick}
          sx={{
            marginTop: !isPhoneNumberSubmitted ? '100px' : '330px',
            color: '#fff',
            fontSize: '18px',
          }}
        >
          {isPhoneNumberSubmitted ? t('Verify & Hop Back In!') : t('Send OTP')}
        </Button>
        <Typography
          sx={{
            color: '#595959',
            fontWeight: 500,
            fontSize: '15px',
            lineHeight: '22px',
            textAlign: 'center',
          }}
        >
          {t('Don’t have an account?')}
          <Button
            variant="text"
            sx={{ color: '#DF4303' }}
            onClick={() => setIsModalOpen(true)}
          >
            {t('Sign Up')}
          </Button>
        </Typography>
        <SignUpModal open={isModalOpen} handleClose={handleModalClose} />
      </Box>
    </motion.div>
  );
};

export default UserLogin;
