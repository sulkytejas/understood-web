/* eslint-disable */

import './App.css';
import { React, useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Typography, useMediaQuery } from '@mui/material';
import Bowser from 'bowser';
import { SocketProvider } from './components/context/SocketContext';
// import { WebRTCProvider } from './components/context/WebrtcContext';
import { WebRTCBridge } from './components/context/WebrtcBridge';
import { AudioTranscriptionProvider } from './components/context/AudioTranscriptionContext';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import VideoCall from './components/VideoCall/VideoCall';
import CreateMeetingPage from './components/Meeting/CreateMeeting';
import PracticeMain from './components/PraticeMode/PracticeMain';
import UserLogin from './components/Login/UserLogin';
import MeetingEnded from './components/Meeting/MeetingEnded';
import GoogleCallback from './components/Login/GoogleCallback';
import ProtectedRoute from './components/onBoarding/ProtectedRoute';
import PrivacyPolicy from './components/onBoarding/PrivacyPolicy';
// import UnsupportedBrowser from './components/onBoarding/Unsupported';
import TermsAndCondition from './components/onBoarding/TermsAndCondition';
import { initializeTensorFlow } from './components/utils/tensorFlowUtils';
import WelcomeScreen from './components/onBoarding/WelcomeScreen';
import LoadingSpinner from './components/onBoarding/LoadingSpinner';
import { setEmail, setUserName, setUserPhoneNumber } from './redux/userSlice';
import {
  setLocalSpokenLanguage,
  setLocalTranslationLanguage,
} from './redux/translationSlice';
import { setBrowserName } from './redux/uiSlice';

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [spokenLanguageStorage, setSpokenLanguageStorage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChrome, setIsChrome] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
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
    initializeTensorFlow();
  }, []);

  useEffect(() => {
    const spokenLanguage = localStorage.getItem('spokenLanguage');
    if (spokenLanguage) {
      setSpokenLanguageStorage(spokenLanguage);
      dispatch(setLocalSpokenLanguage(spokenLanguage));
    }

    const translationLanguagePreference = localStorage.getItem(
      'translationLanguagePreference',
    );
    if (translationLanguagePreference) {
      dispatch(setLocalTranslationLanguage(translationLanguagePreference));
    }
  }, []);

  const isLocaleAndSpokenSet = useMemo(() => {
    const sl = localStorage.getItem('spokenLanguage');
    const ll = localStorage.getItem('locale');

    if (sl && ll) {
      return true;
    }

    return false;
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
          setUserDetails({ ...user });

          if (user?.email) {
            dispatch(setEmail(user?.email));
          } else {
            dispatch(setUserPhoneNumber(user?.phoneNumber));
          }

          setUserData({ ...user });
          console.log(user);
        } else {
          dispatch(setUserName(null));
          dispatch(setUserPhoneNumber(null));
          dispatch(setEmail(null));
        }
      } catch (error) {
        dispatch(setUserName(null));
        dispatch(setUserPhoneNumber(null));
        dispatch(setEmail(null));

        console.error('Error checking authentication:', error);
      } finally {
        console.log('Setting loading to false...');
        setLoading(false);
      }
    };
    checkAuth();
  }, [dispatch]);

  // if (!isDeviceSupported) {
  //   return <UnsupportedBrowser variant="device" />;
  // }

  if (loading) {
    console.log('Loading spinner on app page');
    return <LoadingSpinner />; // Render a loading indicator while waiting for user data
  }

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };
  const pageTransition = {
    duration: 0.3,
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100vw', md: '430px' },
        // height: '100vh',
        // overflow: 'hidden',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <SocketProvider>
        <WebRTCBridge>
          <AudioTranscriptionProvider>
            <AnimatePresence mode="wait">
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    !isLocaleAndSpokenSet ? (
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                      >
                        <WelcomeScreen />
                      </motion.div>
                    ) : userDetails?.username ? (
                      <Navigate to="/meeting" />
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
                    meetingId ? (
                      <ProtectedRoute>
                        <VideoCall />
                      </ProtectedRoute>
                    ) : (
                      <Navigate to="/meetingEnded" />
                    )
                  }
                />
                <Route
                  path="/vibe/:practiceSessionId"
                  element={
                    <ProtectedRoute>
                      <motion.div
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                      >
                        <PracticeMain />
                      </motion.div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetingEnded"
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                    >
                      <MeetingEnded />
                    </motion.div>
                  }
                />
                <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
                <Route
                  path="/termsAndConditions"
                  element={<TermsAndCondition />}
                />
              </Routes>
            </AnimatePresence>
          </AudioTranscriptionProvider>
        </WebRTCBridge>
      </SocketProvider>
    </Box>
  );
}

export default App;
