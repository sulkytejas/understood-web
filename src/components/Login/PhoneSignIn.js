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
  TextField,
  InputAdornment,
  FormControl,
  MenuItem,
  Select,
  Box,
} from '@mui/material';
import { AsYouType } from 'libphonenumber-js';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { setUserPhoneNumber, setUserName } from '../../redux/userSlice';
import OtpVerification from './OtpVerification';

const CustomTextField = styled(TextField)({
  backgroundColor: '#F9F9F9',
  marginTop: 10,
  borderRadius: '0px',
  borderBottom: '1px solid #A8A8A8',
  '& .MuiOutlinedInput-root': {
    padding: '0px',
    '& fieldset': {
      border: 'none', // Remove the default border
    },
    display: 'flex',
    alignItems: 'center',
    '& input': {
      height: '48px', // Set a fixed height for the input
      boxSizing: 'border-box', // Ensure padding is included in the height
      lineHeight: '22px', // Align text vertically
      fontSize: '12px', // Font size for the input
      color: '#000000',
      '&.Mui-disabled': {
        color: '#707070',
        opacity: 0.8,
        '-webkit-text-fill-color': '#000',
      },
    },
    '& input::placeholder': {
      color: '#000', // Placeholder text color
      opacity: 0.8, // Ensure the color is applied (overrides browser default opacity)
    },
  },
  '& .MuiInputAdornment-root': {
    marginRight: '10px',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 2,
  },
});

const ScreenContainer = styled('div')({
  position: 'relative',
  width: '100%',
  height: '100vh' /* Full viewport height */,
  overflow: 'hidden',
});

const Screen = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

const countries = [
  { code: 'US', dialCode: '+1', name: 'USA' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'RU', dialCode: '+7', name: 'Russia' },
  // Add more countries as needed
];

const PhoneSignIn = forwardRef(
  ({ onLogin, onSetIsPhoneNumberSubmitted }, ref) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState(countries[0]);
    const [userData, setUserData] = useState(null);
    const { t } = useTranslation();

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
        return new Promise((resolve, reject) => {
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
    }, []);

    const handleCountryChange = (event) => {
      const selectedCountry = countries.find(
        (country) => country.code === event.target.value,
      );

      setCountry(selectedCountry);
      setPhoneNumber('');
    };

    const handlePhoneNumberChange = (event) => {
      const inputNumber = event.target.value;
      const formatter = new AsYouType(country.code);

      setPhoneNumber(formatter.input(inputNumber));
    };

    // Send OTP to the phone number
    const sendOTP = () => {
      setLoading(true);
      let appVerifier = window.recaptchaVerifier;

      const unformattedPhoneNumber = phoneNumber.replace(/\D/g, '');
      console.log(`${country.dialCode}${unformattedPhoneNumber}`);
      signInWithPhoneNumber(
        auth,
        `${country.dialCode}${phoneNumber}`,
        appVerifier,
      )
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
        });
    };

    // Verify OTP
    const verifyOTP = () => {
      if (confirmationResult) {
        confirmationResult
          .confirm(otp)
          .then(async (result) => {
            // User signed in successfully.
            const user = result.user;
            setUserData({ ...user });

            try {
              const apiUrl = process.env.REACT_APP_API_URL;
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
                }),
              });

              const serverResponse = await response.json();
              console.log('serverResponse ', serverResponse);

              if (serverResponse.message === 'success') {
                /**
                 * Store user info into redux
                 */

                console.log('serverResponse', serverResponse);
                console.log('Login complete', user);

                dispatch(setUserPhoneNumber(serverResponse?.user?.phoneNumber));
                dispatch(setUserName(serverResponse?.user?.username));

                navigate('/meeting');
              }
            } catch (error) {
              console.error('Error from server to complete login ', error);
            }
          })
          .catch((error) => {
            // User couldn't sign in (bad verification code?)
            console.error('Error during OTP verification', error);
          });
      }
    };

    useImperativeHandle(ref, () => ({
      sendOTP,
      verifyOTP,
    }));

    return (
      <Box
        sx={{
          marginTop: !confirmationResult ? '160px' : '72px',
        }}
      >
        {/* <ScreenContainer>
        <CSSTransition
          in={!confirmationResult}
          timeout={500}
          classNames="fade"
          unmountOnExit
        >
          <Screen> */}
        {!confirmationResult && (
          <FormControl fullWidth>
            <CustomTextField
              placeholder={t('Your Number – Your Ticket to Talk')}
              variant="outlined"
              fullWidth
              margin="normal"
              onChange={handlePhoneNumberChange}
              value={phoneNumber}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Select
                      value={country.dialCode}
                      onChange={handleCountryChange}
                      displayEmpty
                      variant="standard"
                      disableUnderline
                      sx={{
                        background: '#DFEBFF',
                        borderRadius: '6px',
                        paddingLeft: ' 6px',
                      }}
                      renderValue={() => (
                        <img
                          loading="lazy"
                          width="20"
                          srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                          src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                        />
                      )}
                    >
                      {countries.map((option) => (
                        <MenuItem key={option.code} value={option.code}>
                          <img
                            loading="lazy"
                            width="20"
                            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                            alt={option.name}
                            style={{ marginRight: 8 }}
                          />
                          {option.name} ({option.dialCode})
                        </MenuItem>
                      ))}
                    </Select>
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
        )}
        {/* </Screen>
        </CSSTransition> */}

        {/* <CSSTransition
          in={!!confirmationResult}
          timeout={500}
          classNames="fade"
          unmountOnExit
        > */}
        {/* <Screen> */}
        {!!confirmationResult && (
          <OtpVerification onSetOtp={setOtp} phoneNumber={phoneNumber} />
        )}

        {/* </Screen> */}
        {/* </CSSTransition> */}
        {/* </ScreenContainer> */}
        <div id="recaptcha-container"></div>
      </Box>
    );
  },
);

export default PhoneSignIn;
