import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { IconButton, FormControl, FormHelperText } from '@mui/material';
import PhoneInput from 'react-phone-number-input';
import enLabels from 'react-phone-number-input/locale/en.json';
import 'react-phone-number-input/style.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';
import { usePhoneAuth } from './hooks/usePhoneAuth';
import OtpVerification from './OtpVerification';
import CountrySelector from './CountrySelector';
import { CustomPhoneInput, PhoneSignInContainer } from './Login.styles';

const PhoneSignIn = forwardRef(
  (
    { onLogin, onSetIsPhoneNumberSubmitted, setLoading: setParentLoading },
    ref,
  ) => {
    const { t } = useTranslation();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('US');
    const [phoneSignInError, setPhoneSignInError] = useState('');

    const {
      loading,
      error,
      confirmationResult,
      sendOTP: sendOTPHook,
      verifyOTP: verifyOTPHook,
      resetAuth,
    } = usePhoneAuth();

    useEffect(() => {
      setParentLoading(loading);
    }, [loading, setParentLoading]);

    useEffect(() => {
      if (error) {
        setPhoneSignInError(error);
      }
    }, [error]);

    useEffect(() => {
      async function detectCountry() {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data && data.country_code) {
            setSelectedCountry(data.country_code.toUpperCase());
          } else {
            setSelectedCountry('US');
          }
        } catch {
          setSelectedCountry('US');
        }
      }
      detectCountry();
    }, []);

    const sendOTP = useCallback(async () => {
      if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        setPhoneSignInError(t('Please enter a valid phone number'));
        return;
      }

      const result = await sendOTPHook(phoneNumber);
      if (result.success) {
        onLogin('phoneLogin');
        onSetIsPhoneNumberSubmitted(true);
      }
    }, [phoneNumber, sendOTPHook, t, onLogin, onSetIsPhoneNumberSubmitted]);

    const verifyOTP = useCallback(async () => {
      await verifyOTPHook(otp);
    }, [otp, verifyOTPHook]);

    useImperativeHandle(ref, () => ({
      sendOTP,
      verifyOTP,
    }));

    const handleBackButton = useCallback(() => {
      resetAuth();
      onLogin('phoneLogin');
      onSetIsPhoneNumberSubmitted(false);
    }, [resetAuth, onLogin, onSetIsPhoneNumberSubmitted]);

    return (
      <PhoneSignInContainer hasConfirmation={!!confirmationResult}>
        {!confirmationResult && (
          <FormControl fullWidth>
            <CustomPhoneInput data-invalid={Boolean(phoneSignInError)}>
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
                  <CountrySelector
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
          </FormControl>
        )}

        {!!confirmationResult && (
          <div>
            <IconButton
              color="primary"
              aria-label="back button"
              component="span"
              onClick={handleBackButton}
            >
              <ArrowBackIcon />
            </IconButton>

            <OtpVerification
              onSetOtp={setOtp}
              isOtpInvalid={!!error}
              phoneNumber={phoneNumber}
            />
          </div>
        )}
        <div id="recaptcha-container"></div>
      </PhoneSignInContainer>
    );
  },
);

PhoneSignIn.displayName = 'PhoneSignIn';

export default React.memo(PhoneSignIn);
