import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../onBoarding/LoadingSpinner';

import { setUserName, setEmail } from '../../redux/userSlice';

function GoogleCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');

    if (code) {
      // Send the authorization code to your backend for exchange with an access token
      const apiUrl = process.env.REACT_APP_API_URL;
      fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
        .then((response) => response.json())
        .then(async (data) => {
          const { userData } = data;
          console.log('Server response:', data);
          if (data?.message === 'Authentication successful') {
            try {
              const apiUrl = process.env.REACT_APP_API_URL;
              const response = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  phoneNumber: null,
                  email: userData?.email,
                  token: data?.sessionToken,
                  uid: userData?.at_hash,
                }),
              });

              const serverResponse = await response.json();
              if (serverResponse.message === 'success') {
                /**
                 * Store user info into redux
                 */

                console.log('serverResponse', serverResponse?.user?.email);
                console.log('Login complete', userData);

                dispatch(setUserName(serverResponse?.user?.username));
                dispatch(setEmail(serverResponse?.user?.email));

                navigate('/meeting');
              }
            } catch (error) {
              console.error('Error from server to complete login ', error);
            }
          }
          // Handle successful authentication (e.g., store tokens, redirect to dashboard)
        })
        .catch((error) => console.error('Error:', error));
    }
  }, [location]);

  return <LoadingSpinner />;
}

export default GoogleCallback;
