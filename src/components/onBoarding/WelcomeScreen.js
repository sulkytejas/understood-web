import React, { useState, useEffect } from 'react';
import {
  Container,
  Button,
  Typography,
  IconButton,
  Grid,
  Box,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { ReactComponent as LogoIcon } from '../assets/understood_logo_text.svg';
import { setLocalSpokenLanguage } from '../../redux/translationSlice';
import { useTranslation } from 'react-i18next';
import { getCountriesList } from '../utils/countriesConfig';
import i18n from '../../i18n';

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
  // overflow: 'hidden',
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

const translations = [
  { lang: 'English', text: 'Select your language to begin.' },
  { lang: 'Hindi', text: 'शुरू करने के लिए अपनी भाषा चुनें।' },
  { lang: 'Arabic', text: 'اختر لغتك للبدء.' },
  { lang: 'Chinese (simplified)', text: '选择您的语言开始。' },
  { lang: 'Marathi', text: 'प्रारंभ करण्यासाठी आपली भाषा निवडा.' },
  { lang: 'Russian', text: 'Выберите свой язык, чтобы начать.' },
  { lang: 'German', text: 'Wählen Sie Ihre Sprache, um zu beginnen.' },
];

const WelcomeScreen = () => {
  const [languageCode, setLanguageCode] = useState('en-US');
  const [locale, setLocale] = useState('en');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const countries = getCountriesList();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger fade out
      setFade(false);

      // After fade-out time, change the text and fade in again
      const timeout = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % translations.length);
        setFade(true);
      }, 500); // match this with transition duration in CSS

      return () => clearTimeout(timeout);
    }, 3000); // Change language every 2 seconds

    return () => clearInterval(interval);
  }, [translations.length]);

  const handleClick = () => {
    dispatch(setLocalSpokenLanguage(languageCode));
    localStorage.setItem('spokenLanguage', languageCode);
    localStorage.setItem('translationLanguagePreference', languageCode);
    localStorage.setItem('locale', locale);
    navigate('/login');
  };

  const handleLanguageChange = (event) => {
    const selectedCode = event.target.value;

    console.log('Selected language:', selectedCode);

    setLanguageCode(selectedCode);

    // Find the actual object from your countries array
    const foundCountry = countries.find(
      (country) => country.languageCode === selectedCode,
    );
    if (foundCountry) {
      setLocale(foundCountry.locale);
      i18n.changeLanguage(foundCountry.locale);
    }
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

      <Box
        sx={{
          marginBottom: '30px',
          alignSelf: 'start',
          textAlign: 'left',
        }}
      >
        <Typography
          sx={{
            fontSize: '38px',
            lineHeight: '57px',
            fontWeight: '500',
          }}
        >
          {t('Dreams Without Boundaries')}
        </Typography>
        <Typography
          sx={{
            fontSize: '20px',
            lineHeight: '30px',
            fontWeight: '400',
            transition: 'opacity 0.5s ease-in-out',
            opacity: fade ? 1 : 0,
          }}
        >
          {translations[currentIndex].text}
        </Typography>
      </Box>

      <StyledLanguagesContainer
        container
        spacing={2}
        justifyContent="center"
        alignItems={'center'}
        sx={{
          marginBottom: '16px',
        }}
      >
        <FormControl
          sx={{ width: '100%', maxWidth: '350px', marginLeft: '10px' }}
        >
          <InputLabel>{t('Select Language')}</InputLabel>
          <Select
            label={t('Select Language')}
            value={languageCode}
            onChange={handleLanguageChange}
          >
            {countries.map((country) => (
              <MenuItem key={country.languageCode} value={country.languageCode}>
                <Box display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: '#4abbc9',
                      color: '#fff',
                      height: 24,
                      width: 24,
                      marginRight: 2,
                      fontSize:
                        country.languageCode === 'zh-CN' ? '12px' : '14px',
                    }}
                  >
                    {country.avatar}
                  </Avatar>
                  {t(country.name)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        {t('Confirm & Join')}
      </Button>
    </StyledContainer>
  );
};

export default WelcomeScreen;
