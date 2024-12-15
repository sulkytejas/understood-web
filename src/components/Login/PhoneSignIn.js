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
import { styled } from '@mui/system';
import {
  Box,
  IconButton,
  FormControl,
  FormHelperText,
  TextField,
  Autocomplete,
  Popover,
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input';
import enLabels from 'react-phone-number-input/locale/en.json'; // Country name labels
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@mui/system';
import { setUserPhoneNumber, setUserName, setUid } from '../../redux/userSlice';
import OtpVerification from './OtpVerification';
import { t } from 'i18next';

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

  const options = countries.map((country) => ({
    code: country,
    label: labels[country],
    callingCode: `+${getCountryCallingCode(country)}`,
    flag: flags[country],
  }));

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
          <selectedOption.flag
            alt={selectedOption.code}
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
          style: { width: '100%', maxHeight: 400 }, // match width as needed
        }}
      >
        <Box sx={{ padding: '8px' }}>
          <Autocomplete
            options={options}
            fullWidth
            getOptionLabel={(option) =>
              `${option.label} (${option.callingCode})`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t('Search for a country')}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '6px',
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <ListItem
                {...props}
                key={option.code}
                sx={{ paddingLeft: '8px', paddingRight: '8px' }}
              >
                <ListItemIcon sx={{ minWidth: '32px' }}>
                  <option.flag
                    title={option.code}
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
              </ListItem>
            )}
            onChange={(event, newValue) => {
              if (newValue) {
                onChange(newValue.code);
              }
              handleClose();
            }}
          />
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

    // Load reCAPTCHA script and initialize RecaptchaVerifier
    useEffect(() => {
      const loadRecaptchaScript = () => {
        return new Promise((resolve, reject) => {
          if (document.getElementById('recaptcha-script')) {
            resolve(); // Script already loaded
            return;
          }

          const script = document.createElement('script');
          script.id = 'recaptcha-script';
          script.src =
            'https://www.google.com/recaptcha/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error('Failed to load reCAPTCHA script'));
          document.body.appendChild(script);
        });
      };

      const initializeRecaptchaVerifier = () => {
        return new Promise((resolve) => {
          const checkRecaptcha = () => {
            if (window.grecaptcha && window.grecaptcha.render) {
              resolve();
            } else {
              setTimeout(checkRecaptcha, 100);
            }
          };
          checkRecaptcha();
        });
      };

      const initializeRecaptchaVerifierLoaded = () => {
        if (!document.getElementById('recaptcha-container')) {
          console.error('reCAPTCHA container not found in DOM.');
          return;
        }
        try {
          if (auth && auth.settings) {
            auth.settings.appVerificationDisabledForTesting = true;
          } else {
            console.error('Firebase Auth is not properly initialized.');
            return;
          }

          // Initialize the RecaptchaVerifier
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
              size: 'invisible',
              callback: () => {
                console.log('recaptcha resolved..');
              },
            },
          );

          // Render the reCAPTCHA widget
          window.recaptchaVerifier
            .render()
            .then((widgetId) => {
              setLoading(false);
              console.log('reCAPTCHA rendered with widgetId:', widgetId);
            })
            .catch((error) => {
              console.error('Error rendering reCAPTCHA widget:', error);
            });
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error);
        }
      };

      loadRecaptchaScript()
        .then(initializeRecaptchaVerifier)
        .then(() => {
          if (auth && window.grecaptcha && window.grecaptcha.render) {
            initializeRecaptchaVerifierLoaded();
          } else {
            console.error(
              'Firebase auth or reCAPTCHA not initialized properly.',
            );
          }
        });
    }, [setLoading]);

    // Send OTP to the phone number
    const sendOTP = () => {
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        setPhoneSignInError(t('Please enter a valid phone number'));
        return;
      }

      setLoading(true);
      let appVerifier = window.recaptchaVerifier;

      signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
          // SMS sent. Prompt user to type the code from the message
          setConfirmationResult(confirmationResult);
          onLogin('phoneLogin');
          onSetIsPhoneNumberSubmitted(true);
          console.log('OTP sent');
          setLoading(false);
        })
        .catch((error) => {
          // Error; SMS not sent
          console.error('Error during signInWithPhoneNumber ', error);
          setPhoneSignInError(
            'Phone number not found. Please sign up for early access',
          );
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
            }
          })
          .catch((error) => {
            setIsOtpInvalid(true);
            // User couldn't sign in (bad verification code?)
            console.error('Error during OTP verification', error);
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
              <PhoneInput
                flags={flags}
                international
                countryCallingCodeEditable={false}
                // defaultCountry="US"
                placeholder={t('Your Number—Your Key to Connect')}
                value={phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value || '');
                  setPhoneSignInError('');
                }}
                countrySelectComponent={(props) => (
                  <SearchableCountrySelect {...props} labels={enLabels} />
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
