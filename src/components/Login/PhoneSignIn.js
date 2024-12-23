// src/components/PhoneSignIn.js
/* eslint-disable */
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { fontFamily, styled } from '@mui/system';
import {
  Box,
  IconButton,
  FormControl,
  FormHelperText,
  List,
  Popover,
  Button,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputLabel,
} from '@mui/material';
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input';
import enLabels from 'react-phone-number-input/locale/en.json'; // Country name labels
import ReactCountryFlag from 'react-country-flag';
import 'react-phone-number-input/style.css';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@mui/system';
import { setUserPhoneNumber, setUserName, setUid } from '../../redux/userSlice';
import OtpVerification from './OtpVerification';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.2); opacity: 1; }
`;

const AnimatedArrow = styled(ArrowDropDownIcon)(({ theme, animate }) => ({
  ...(animate && {
    animation: `${pulseAnimation} 1s infinite`,
  }),
}));

// Custom styling for phone input
const CustomPhoneInput = styled('div')(({ theme }) => ({
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

  // Error state styling
  '&[data-invalid="true"]': {
    '& .PhoneInput': {
      borderBottomColor: '#f44336',
    },
  },
}));

// This component handles the country selection UI
function SearchableCountrySelect({ value, onChange, labels, ...rest }) {
  const countries = getCountries();
  const defaultCountry = ''; // fallback if none selected

  const selectedCode = value || defaultCountry;
  const [anchorEl, setAnchorEl] = useState(null);

  // Prepare data for our country list
  const options = countries.map((country) => ({
    code: country,
    label: labels[country],
    callingCode: `+${getCountryCallingCode(country)}`,
  }));

  // Find selected option or default
  const selectedOption =
    options.find((opt) => opt.code === selectedCode) ||
    options.find((opt) => opt.code === defaultCountry);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  console.log('selectedOption', selectedOption);

  return (
    <>
      <Button
        onClick={handleOpen}
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#DFEBFF',
          borderRadius: '6px',
          padding: '0px',
          minWidth: 'auto',
          padding: '10px',
        }}
      >
        {selectedOption && (
          <ReactCountryFlag
            countryCode={selectedOption.code.toUpperCase()}
            svg
            style={{
              width: '20px',
              height: 'auto',
              borderRadius: '2px',
              marginRight: '6px',
            }}
          />
        )}
        <AnimatedArrow sx={{ zIndex: 2 }} animate={!selectedOption} />
        {/* {selectedOption && selectedOption.callingCode} */}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          style: { maxWidth: '400px', maxHeight: 400, width: '100%' }, // match width as needed
        }}
      >
        <Box sx={{ padding: '8px' }}>
          <List sx={{ padding: 0 }}>
            {options.map((option) => (
              <ListItemButton
                key={option.code}
                onClick={() => {
                  onChange(option.code);
                  handleClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: '32px' }}>
                  <ReactCountryFlag
                    countryCode={option.code}
                    svg
                    style={{
                      width: '20px',
                      height: 'auto',
                      borderRadius: '2px',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${option.label} (${option.callingCode})`}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
}

const PhoneSignIn = forwardRef(
  ({ onLogin, onSetIsPhoneNumberSubmitted, setLoading }, ref) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [userData, setUserData] = useState(null);
    const { t } = useTranslation();
    const [isOtpInvalid, setIsOtpInvalid] = useState(false);
    const [phoneSignInError, setPhoneSignInError] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('US');

    useEffect(() => {
      return () => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      };
    }, []);

    useEffect(() => {
      async function detectCountry() {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data && data.country_code) {
            // e.g. "US", "IN", "GB", ...
            setSelectedCountry(data.country_code.toUpperCase());
          } else {
            setSelectedCountry('US');
          }
        } catch {
          // In case of any error, default to US
          setSelectedCountry('US');
        }
      }
      detectCountry();
    }, []);

    // Send OTP to the phone number
    const sendOTP = () => {
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        setPhoneSignInError(t('Please enter a valid phone number'));
        return;
      }
      setLoading(true);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'sign-in-button',
          {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved successfully');
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
              setPhoneSignInError('Please refresh page and try again');
              setLoading(false);
            },
            'error-callback': (error) => {
              console.error('reCAPTCHA error:', error);
              setPhoneSignInError('Something went wrong. Please try again');
              setLoading(false);
            },
          },
        );
      }

      const appVerifier = window.recaptchaVerifier;
      console.log('Starting phone sign in for:', phoneNumber);

      signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
          // SMS sent. Prompt user to type the code from the message
          setConfirmationResult(confirmationResult);
          onLogin('phoneLogin');
          onSetIsPhoneNumberSubmitted(true);
          console.log('OTP sent', confirmationResult);
          setLoading(false);
        })
        .catch((error) => {
          // Error; SMS not sent
          console.error('Error during signInWithPhoneNumber ', error);
          setPhoneSignInError(
            'Phone number not found. Please enter a valid phone number.',
          );
          setLoading(false);
        });
    };

    // Verify OTP
    const verifyOTP = () => {
      if (confirmationResult) {
        confirmationResult
          .confirm(otp)
          .then(async (result) => {
            setLoading(true);
            // User signed in successfully.
            const user = result.user;
            setUserData({ ...user });

            try {
              const apiUrl = process.env.REACT_APP_API_URL;
              const spokenLanguage = localStorage.getItem('spokenLanguage');
              const translationLanguage = localStorage.getItem(
                'translationLanguagePreference',
              );
              const locale = localStorage.getItem('locale');

              const response = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  phoneNumber: user?.phoneNumber,
                  email: user?.email,
                  token: user?.accessToken,
                  uid: user?.uid,
                  source: 'phone',
                  spokenLanguage,
                  translationLanguage,
                  locale,
                }),
              });

              const serverResponse = await response.json();
              console.log('serverResponse ', serverResponse);

              if (serverResponse.message === 'success') {
                // Store user info into redux
                console.log('serverResponse', serverResponse);
                console.log('Login complete', user);

                dispatch(setUserPhoneNumber(serverResponse?.user?.phoneNumber));
                dispatch(setUserName(serverResponse?.user?.username));
                dispatch(setUid(serverResponse?.user?.uid));

                const redirectQuery = new URLSearchParams(location.search);
                const meetingId = redirectQuery.get('meetingId');

                setLoading(false);
                if (meetingId) {
                  navigate(
                    `/meeting?meetingId=${encodeURIComponent(meetingId)}`,
                  );
                } else {
                  navigate('/meeting');
                }
              }
            } catch (error) {
              console.error('Error from server to complete login ', error);
              setLoading(false);
            }
          })
          .catch((error) => {
            setIsOtpInvalid(true);
            // User couldn't sign in (bad verification code?)
            console.error('Error during OTP verification', error);
            setLoading(false);
          });
      }
    };

    useImperativeHandle(ref, () => ({
      sendOTP,
      verifyOTP,
    }));

    const backButtonHandler = () => {
      setConfirmationResult(null);
      onLogin('phoneLogin');
      onSetIsPhoneNumberSubmitted(false);
    };

    return (
      <Box
        sx={{
          marginTop: !confirmationResult ? '90px' : '72px',
        }}
      >
        {!confirmationResult && (
          <FormControl fullWidth>
            <CustomPhoneInput data-invalid={Boolean(phoneSignInError)}>
              {/* <InputLabel htmlFor="phone-input">
                {t('Your Number—Your Key to Connect')}
              </InputLabel> */}
              <PhoneInput
                international={false}
                countryCallingCodeEditable={false}
                defaultCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                placeholder={t('Your Number—Your Key to Connect')}
                value={phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value || '');
                  setPhoneSignInError('');
                }}
                countrySelectComponent={(props) => (
                  <SearchableCountrySelect
                    {...props}
                    labels={enLabels}
                    onChange={(newCountry) => {
                      setSelectedCountry(newCountry);
                    }}
                  />
                )}
              />
              {phoneSignInError && (
                <FormHelperText
                  error
                  sx={{ marginLeft: '14px', marginTop: '4px' }}
                >
                  {phoneSignInError}
                </FormHelperText>
              )}
            </CustomPhoneInput>
            {/* {phoneSignInError && (
              <FormHelperText>
                {t(
                  'Phone number not found. Sign up below to gain early access.',
                )}
              </FormHelperText>
            )} */}
          </FormControl>
        )}

        {!!confirmationResult && (
          <div>
            <IconButton
              color="primary"
              aria-label="back button"
              component="span"
              onClick={backButtonHandler}
            >
              <ArrowBackIcon />
            </IconButton>

            <OtpVerification
              onSetOtp={setOtp}
              isOtpInvalid={isOtpInvalid}
              phoneNumber={phoneNumber}
            />
          </div>
        )}
        <div id="recaptcha-container"></div>
      </Box>
    );
  },
);

export default PhoneSignIn;
