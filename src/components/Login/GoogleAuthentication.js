import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button, Typography, SvgIcon, Box } from '@mui/material';
import { styled } from '@mui/system';

import { ReactComponent as CustomSvgIcon } from '../assets/googleLogin.svg';

const GoogleButton = styled(Button)({
  alignItems: 'center',
  justifyContent: 'center',
  height: 42,
  backgroundColor: '#fff',
  boxShadow:
    ' 0px 7px 7px 0px rgba(0, 0, 0, 0.2),0px 15px 9px 0px rgba(0, 0, 0, 0.05),0px 26px 10px 0px rgba(0, 0, 0, 0.01), 0px 41px 11px 0px rgba(0, 0, 0, 0)',
  textTransform: 'none', // Prevents uppercase text
  '&:hover': {
    backgroundColor: '#f8f8f8',
  },
});

const GoogleIcon = styled(SvgIcon)({
  marginRight: 12,
});

const GoogleAuthentication = () => {
  const googleLogin = useGoogleLogin({
    flow: 'authorization_code',
    auto_select: true,
    ux_mode: 'redirect',
    redirect_uri: 'http://localhost:3000/googleCallback',
    select_account: true,
  });

  return (
    <Box
      sx={{
        margin: '40px 0',
        zIndex: 2,
      }}
    >
      <GoogleButton fullWidth variant="contained" onClick={() => googleLogin()}>
        <GoogleIcon
          alt="Google"
          width="20"
          component={CustomSvgIcon}
          inheritViewBox
        />
        <Typography color="textPrimary">Google</Typography>
      </GoogleButton>
    </Box>
  );
};

export default GoogleAuthentication;
