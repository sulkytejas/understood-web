import React, { useRef, useState, useCallback } from 'react';
import { CircularProgress } from '@mui/material';
import PhoneSignIn from './PhoneSignIn';
import { ReactComponent as LogoIcon } from '../../assets/understood_logo.svg';
import { useTranslation } from 'react-i18next';
import {
  BackgroundLogo,
  LoginContainer,
  WelcomeTitle,
  WelcomeSubtitle,
  AnnouncementText,
  LoginButton,
} from './Login.styles';

const UserLogin = () => {
  const [loginMethod, setLoginMethod] = useState(null);
  const { t } = useTranslation();
  const [isPhoneNumberSubmitted, setIsPhoneNumberSubmitted] = useState(false);
  const phoneLoginRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = useCallback(
    (e) => {
      e.preventDefault();
      if (phoneLoginRef.current) {
        if (!isPhoneNumberSubmitted) {
          phoneLoginRef.current.sendOTP();
        } else {
          phoneLoginRef.current.verifyOTP();
        }
      }
    },
    [isPhoneNumberSubmitted],
  );

  return (
    <LoginContainer>
      <BackgroundLogo>
        <LogoIcon />
      </BackgroundLogo>
      {!isPhoneNumberSubmitted && (
        <div>
          <AnnouncementText>{t('UI 2.0 coming soon..')} 🎉</AnnouncementText>
          <WelcomeTitle>{t('Welcome Back!')}</WelcomeTitle>
          <WelcomeSubtitle>
            {t('One platform, countless voices, endless possibilities.')}
          </WelcomeSubtitle>
        </div>
      )}
      {loginMethod !== 'googleLogin' && (
        <PhoneSignIn
          onLogin={setLoginMethod}
          onSetIsPhoneNumberSubmitted={setIsPhoneNumberSubmitted}
          ref={phoneLoginRef}
          setLoading={setLoading}
        />
      )}

      <LoginButton
        variant="contained"
        color="primary"
        fullWidth
        className="create-invite-button"
        onClick={handleButtonClick}
        sx={{
          marginTop: !isPhoneNumberSubmitted ? '100px' : '330px',
        }}
        id="sign-in-button"
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : isPhoneNumberSubmitted ? (
          t('Verify & Join!')
        ) : (
          t('Send OTP')
        )}
      </LoginButton>
    </LoginContainer>
  );
};

export default UserLogin;
