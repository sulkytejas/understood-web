import React, { useState } from 'react';
import {
  Container,
  Button,
  Typography,
  IconButton,
  Grid,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { ReactComponent as LogoIcon } from '../assets/understood_logo_text.svg';
import { setLocalSpokenLanguage } from '../../redux/translationSlice';

const countries = [
  { code: 'IN', languageCode: 'hi-Hi', name: 'Hindi' },
  { code: 'US', languageCode: 'en-US', name: 'English' },
  { code: 'RU', languageCode: 'ru-RU', name: 'Russian' },
  // Add more countries as needed
];

// Custom styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  textAlign: 'center',
  padding: theme.spacing(2),
  backgroundColor: '#f5f5f5',
  overflow: 'hidden',
}));

const StyledLogoBox = styled(Box)(() => ({
  marginBottom: '169px',
  zIndex: 2,
}));

const StyledBackButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  zIndex: 2,
}));

const BackgroundLogo = styled(Box)(() => ({
  position: 'absolute',
  right: 0,
  transform: 'translate(0%)',
  height: '100%',
  overflow: 'hidden',
  opacity: 0.06,
  zIndex: 1,
  '& svg': {
    width: '106%', // Make the SVG twice as wide
    height: '100%',
    position: 'relative',
    right: '-46%', // Shift the SVG to the left to show only the left half
  },
}));

const StyledLanguagesContainer = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
  zIndex: 2,
}));

const WelcomeScreen = () => {
  const [languageCode, setLanguageCode] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClick = () => {
    console.log('clicked', languageCode);
    dispatch(setLocalSpokenLanguage(languageCode));
    localStorage.setItem('spokenLanguage', languageCode);
    navigate('/login');
  };

  return (
    <StyledContainer>
      <StyledBackButton>
        <ArrowBackIcon />
      </StyledBackButton>

      {/* Background logo */}
      <BackgroundLogo>
        <LogoIcon />
      </BackgroundLogo>

      {/* Main Logo */}
      <StyledLogoBox>
        <LogoIcon style={{ fontSize: 100 }} /> {/* Adjust size as needed */}
      </StyledLogoBox>

      <Box sx={{ marginBottom: '30px', alignSelf: 'start', textAlign: 'left' }}>
        <Typography
          sx={{
            fontSize: '38px',
            lineHeight: '57px',
            fontWeight: '500',
          }}
        >
          Let’s Get Started!
        </Typography>
        <Typography
          sx={{
            fontSize: '20px',
            lineHeight: '30px',
            fontWeight: '400',
          }}
        >
          Select your spoken language
        </Typography>
      </Box>

      <StyledLanguagesContainer
        container
        spacing={2}
        justifyContent="center"
        sx={{
          marginBottom: '16px',
        }}
      >
        {countries.map((option) => (
          <Grid item key={option.name}>
            <IconButton
              onClick={() => setLanguageCode(option.languageCode)}
              sx={{
                width: 47,
                height: 47,
                padding: '5px',
                background: '#DFEBFF',
                borderRadius: 0,
                '&:active': {
                  background: 'orange',
                },
                '&:hover': {
                  backgroundColor: '#f8cab7',
                },
              }}
            >
              <img
                loading="lazy"
                srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                alt={option.name}
                style={{ width: 24, height: 24 }}
              />
            </IconButton>
          </Grid>
        ))}
      </StyledLanguagesContainer>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        className="create-invite-button"
        onClick={handleClick}
        sx={{ color: '#fff', fontSize: '18px', zIndex: 3 }}
        disabled={!languageCode}
      >
        Confirm & Join
      </Button>
    </StyledContainer>
  );
};

export default WelcomeScreen;
