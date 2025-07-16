import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Typography, SvgIcon } from '@mui/material';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { ReactComponent as CustomSvgIcon } from '../assets/googleLogin.svg';
import { GoogleButton, GoogleContainer } from './Login.styles';

const GoogleIcon = styled(SvgIcon)({
  marginRight: 12,
});

const GoogleAuthentication = () => {
  const { t } = useTranslation();
  const googleLogin = useGoogleLogin({
    flow: 'authorization_code',
    auto_select: true,
    ux_mode: 'redirect',
    redirect_uri: process.env.REACT_APP_GOOGLE_REDIRECT_URL,
    select_account: true,
  });

  return (
    <GoogleContainer>
      <GoogleButton fullWidth variant="contained" onClick={() => googleLogin()}>
        <GoogleIcon
          alt="Google"
          width="20"
          component={CustomSvgIcon}
          inheritViewBox
        />
        <Typography color="textPrimary">{t('Google your way in!')}</Typography>
      </GoogleButton>
    </GoogleContainer>
  );
};

export default GoogleAuthentication;
