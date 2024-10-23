/* eslint-disable */

import './App.css';
import { React, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Box, useMediaQuery } from '@mui/material';
import Bowser from 'bowser';
import { SocketProvider } from './components/context/SocketContext';
import { WebRTCProvider } from './components/context/WebrtcContext';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import VideoCall from './components/VideoCall/VideoCall';
import CreateMeetingPage from './components/Meeting/CreateMeeting';
import UserLogin from './components/Login/UserLogin';
import MeetingEnded from './components/Meeting/MeetingEnded';
import GoogleCallback from './components/Login/GoogleCallback';
import ProtectedRoute from './components/onBoarding/ProtectedRoute';
import PrivacyPolicy from './components/onBoarding/PrivacyPolicy';
import UnsupportedBrowser from './components/onBoarding/Unsupported';
import TermsAndCondition from './components/onBoarding/TermsAndCondition';

import WelcomeScreen from './components/onBoarding/WelcomeScreen';
import LoadingSpinner from './components/onBoarding/LoadingSpinner';
import { setEmail, setUserName, setUserPhoneNumber } from './redux/userSlice';
import { setLocalSpokenLanguage } from './redux/translationSlice';
import { setBrowserName } from './redux/uiSlice';

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [spokenLanguageStorage, setSpokenLanguageStorage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChrome, setIsChrome] = useState(true);
  const isDeviceSupported = useMediaQuery('(max-width:430px)');
  const meetingId = useSelector((state) => state.meeting.meetingId);

  useEffect(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName();

    dispatch(setBrowserName(browserName));

    console.log('Browser name:', browserName);

    if (browserName !== 'Chrome') {
      setIsChrome(false);
    }
  }, []);

  useEffect(() => {
    const spokenLanguage = localStorage.getItem('spokenLanguage');
    if (spokenLanguage) {
      setSpokenLanguageStorage(spokenLanguage);
      dispatch(setLocalSpokenLanguage(spokenLanguage));
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiURL = process.env.REACT_APP_API_URL;
        const response = await fetch(`${apiURL}/api/check-auth`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const { user } = await response.json();
          dispatch(setUserName(user?.username));

          if (user?.email) {
            dispatch(setEmail(user?.email));
          } else {
            dispatch(setUserPhoneNumber(user?.phoneNumber));
          }

          setUserData({ ...user });
          console.log(user);
        }
      } catch (error) {
        dispatch(setUserName(null));
        dispatch(setUserPhoneNumber(null));
        dispatch(setEmail(null));

        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [dispatch, location]);

  // if (!isChrome) {
  //   return <UnsupportedBrowser variant="browser" />;
  // }

  if (!isDeviceSupported) {
    return <UnsupportedBrowser variant="device" />;
  }

  if (loading) {
    console.log('Loading state is true, rendering spinner...');
    return <LoadingSpinner />; // Render a loading indicator while waiting for user data
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        margin: '0 auto',
        boxSizing: 'border-box',
        '@media (min-width:430px)': {
          padding: '0px',
          maxWidth: '430px', // Adjust this value according to the desired width for iPhone 15 Pro Max
        },
        '@media (max-width: 390px) and (max-width: 400px)': {
          padding: '0px',
          maxWidth: '390px', // Adjust this value according to the desired width for iPhone 15 Pro Max
        },
        '@media (min-width:768px)': {
          maxWidth: '768px', // For tablets and larger devices
        },
      }}
    >
      <SocketProvider>
        <WebRTCProvider>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route
                path="/"
                element={
                  !spokenLanguageStorage ? (
                    <WelcomeScreen />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/login"
                element={
                  !userData?.username ? (
                    <UserLogin />
                  ) : (
                    <Navigate to="/meeting" />
                  )
                }
              />
              <Route path="/googleCallback" element={<GoogleCallback />} />
              <Route
                path="/meeting"
                element={
                  <ProtectedRoute>
                    <CreateMeetingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/videocall/:meetingId"
                element={
                  <ProtectedRoute>
                    {meetingId ? (
                      <VideoCall />
                    ) : (
                      <Navigate to="/meetingEnded" />
                    )}
                  </ProtectedRoute>
                }
              />
              <Route path="/meetingEnded" element={<MeetingEnded />} />
              <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
              <Route
                path="/termsAndConditions"
                element={<TermsAndCondition />}
              />
            </Routes>
          </AnimatePresence>
        </WebRTCProvider>
      </SocketProvider>
    </Box>
  );
}

export default App;
