import { styled } from '@mui/material/styles';
import { Box, Button, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// Animations
export const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.2); opacity: 1; }
`;

// UserLogin styled components
export const BackgroundLogo = styled(Box)(() => ({
  position: 'absolute',
  right: 0,
  transform: 'translate(0%)',
  height: '100%',
  overflow: 'hidden',
  opacity: 0.06,
  '& svg': {
    width: '106%',
    height: '100%',
    position: 'relative',
    left: '-46%',
  },
}));

export const LoginContainer = styled(Box)({
  margin: '16px',
});

export const WelcomeTitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '32px',
  lineHeight: '48px',
  marginTop: '90px',
  color: '#DF4303',
});

export const WelcomeSubtitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '15px',
  lineHeight: '22px',
  color: '#595959',
});

export const AnnouncementText = styled(Typography)({
  textAlign: 'center',
  textDecoration: 'underline',
  color: '#000',
});

export const LoginButton = styled(Button)(() => ({
  color: '#fff',
  fontSize: '18px',
  '&.MuiButton-root': {
    textTransform: 'none',
  },
}));

// GoogleAuthentication styled components
export const GoogleButton = styled(Button)({
  alignItems: 'center',
  justifyContent: 'center',
  height: 42,
  backgroundColor: '#fff',
  boxShadow:
    '0px 7px 7px 0px rgba(0, 0, 0, 0.2), 0px 15px 9px 0px rgba(0, 0, 0, 0.05), 0px 26px 10px 0px rgba(0, 0, 0, 0.01), 0px 41px 11px 0px rgba(0, 0, 0, 0)',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#f8f8f8',
  },
});

export const GoogleContainer = styled(Box)({
  margin: '40px 0',
  zIndex: 2,
});

// PhoneSignIn styled components
export const CustomPhoneInput = styled('div')(() => ({
  '& .PhoneInput': {
    backgroundColor: '#F9F9F9',
    marginTop: 10,
    borderRadius: '0px',
    borderBottom: '1px solid #A8A8A8',
    display: 'flex',
    alignItems: 'center',
    padding: '0px',
    width: '100%',

    '& input': {
      fontFamily: 'Exo 2',
      height: '48px',
      boxSizing: 'border-box',
      lineHeight: '22px',
      fontSize: '16px',
      color: '#000000',
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      width: '100%',
      padding: '0 10px',

      '&::placeholder': {
        color: '#000',
        opacity: 0.8,
      },

      '&:disabled': {
        color: '#707070',
        opacity: 0.8,
        '-webkit-text-fill-color': '#000',
      },
    },

    '& .PhoneInputCountry': {
      marginRight: '10px',
      marginLeft: 10,
      display: 'flex',
      alignItems: 'center',
      background: '#DFEBFF',
      borderRadius: '6px',
      padding: '0 6px',
    },
  },

  '& .PhoneInputInput': {
    '&:focus': {
      outline: 'none',
    },
  },

  '&[data-invalid="true"]': {
    '& .PhoneInput': {
      borderBottomColor: '#f44336',
    },
  },
}));

export const CountrySelectButton = styled(Button)({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#DFEBFF',
  borderRadius: '6px',
  padding: '10px',
  minWidth: 'auto',
});

export const PhoneSignInContainer = styled(Box)(({ hasConfirmation }) => ({
  marginTop: hasConfirmation ? '72px' : '90px',
}));

// OtpVerification styled components
export const OtpTitle = styled(Typography)({
  fontWeight: 400,
  fontSize: '23px',
  lineHeight: '37px',
  marginTop: '30px',
  color: '#DF4303',
});

export const OtpSubtitle = styled(Typography)({
  fontWeight: 500,
  fontSize: '15px',
  lineHeight: '22px',
  color: '#595959',
  marginBottom: '70px',
});

// SignUpModal styled components
export const ModalContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
});

export const ModalTitle = styled(Typography)({
  textAlign: 'center',
});

export const ModalSubtitle = styled(Typography)({
  textAlign: 'center',
});

export const OrText = styled(Typography)({
  textAlign: 'center',
  margin: '8px 0',
});
