import { useState, useEffect, useCallback } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  setUserPhoneNumber,
  setUserName,
  setUid,
} from '../../../redux/userSlice';
import { useTranslation } from 'react-i18next';

export const usePhoneAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const initializeRecaptcha = useCallback(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setError('Please refresh page and try again');
          setLoading(false);
        },
        'error-callback': () => {
          setError('Something went wrong. Please try again');
          setLoading(false);
        },
      });
    }
  }, []);

  const sendOTP = useCallback(
    async (phoneNumber) => {
      setLoading(true);
      setError('');

      try {
        initializeRecaptcha();
        const appVerifier = window.recaptchaVerifier;

        const result = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          appVerifier,
        );
        setConfirmationResult(result);
        setLoading(false);
        return { success: true };
      } catch (error) {
        setError('Phone number not found. Please enter a valid phone number.');
        setLoading(false);
        return { success: false, error: error.message };
      }
    },
    [initializeRecaptcha],
  );

  const verifyOTP = useCallback(
    async (otp) => {
      if (!confirmationResult) {
        setError('No OTP request found. Please request OTP again.');
        return { success: false };
      }

      setLoading(true);
      setError('');

      try {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;

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

        if (serverResponse.message === 'success') {
          dispatch(setUserPhoneNumber(serverResponse?.user?.phoneNumber));
          dispatch(setUserName(serverResponse?.user?.username));
          dispatch(setUid(serverResponse?.user?.uid));

          const redirectQuery = new URLSearchParams(window.location.search);
          const meetingId = redirectQuery.get('meetingId');

          setLoading(false);

          if (meetingId) {
            navigate(`/meeting?meetingId=${encodeURIComponent(meetingId)}`);
          } else {
            navigate('/meeting');
          }

          return { success: true };
        }

        throw new Error('Server login failed');
      } catch (error) {
        setError(t('Invalid OTP. Please try again.'));
        setLoading(false);
        return { success: false, error: error.message };
      }
    },
    [confirmationResult, dispatch, navigate, t],
  );

  const resetAuth = useCallback(() => {
    setConfirmationResult(null);
    setError('');
  }, []);

  return {
    loading,
    error,
    confirmationResult,
    sendOTP,
    verifyOTP,
    resetAuth,
  };
};
