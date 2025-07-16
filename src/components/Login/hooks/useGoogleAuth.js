import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserName, setEmail, setUid } from '../../../redux/userSlice';

export const useGoogleAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');

    if (!code) {
      return { success: false, error: 'No authorization code found' };
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;

      // Exchange code for tokens
      const authResponse = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const authData = await authResponse.json();

      if (authData?.message !== 'Authentication successful') {
        throw new Error('Google authentication failed');
      }

      const { userData } = authData;

      // Complete login
      const spokenLanguage = localStorage.getItem('spokenLanguage');
      const translationLanguage = localStorage.getItem(
        'translationLanguagePreference',
      );

      const loginResponse = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: null,
          email: userData?.email,
          token: authData?.sessionToken,
          uid: userData?.at_hash,
          source: 'google',
          spokenLanguage,
          translationLanguage,
        }),
      });

      const serverResponse = await loginResponse.json();

      if (serverResponse.message === 'success') {
        dispatch(setUserName(serverResponse?.user?.username));
        dispatch(setEmail(serverResponse?.user?.email));
        dispatch(setUid(serverResponse?.user?.uid));

        navigate('/meeting');
        return { success: true };
      }

      throw new Error('Server login failed');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [location.search, dispatch, navigate]);

  return {
    handleGoogleCallback,
  };
};
