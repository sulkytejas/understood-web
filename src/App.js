/* eslint-disable */

import './App.css';
import { React, useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  ThemeProvider,
  Typography,
  useMediaQuery,
  createTheme,
} from '@mui/material';
import Bowser from 'bowser';
import { useSocket } from './components/context/SocketContext';
// import { WebRTCProvider } from './components/context/WebrtcContext';
import { WebRTCBridge } from './components/context/WebrtcBridge';
import { AudioTranscriptionProvider } from './components/context/AudioTranscriptionContext';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import i18n from './i18n';
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
import {
  setEmail,
  setUserName,
  setUserPhoneNumber,
  setUid,
} from './redux/userSlice';
import {
  setLocalSpokenLanguage,
  setLocalTranslationLanguage,
} from './redux/translationSlice';
import { setBrowserName } from './redux/uiSlice';
import baseTheme from './theme';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [spokenLanguageStorage, setSpokenLanguageStorage] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChrome, setIsChrome] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [direction, setDirection] = useState(() => i18n.dir(i18n.language));

  const isDeviceSupported = useMediaQuery('(max-width:430px)');
  const { socket, isSocketConnected } = useSocket();
  const uid = useSelector((state) => state.user.uid);
  const sl = localStorage.getItem('spokenLanguage');
  const ll = localStorage.getItem('locale');
  const isLocaleAndSpokenSet = sl && ll;

  const theme = useMemo(() => {
    return createTheme({ ...baseTheme, direction });
  }, [direction, baseTheme]);

  const cache = useMemo(() => {
    return createCache({
      key: direction === 'rtl' ? 'muirtl' : 'muiltr',
      prepend: true,
      stylisPlugins: direction === 'rtl' ? [rtlPlugin, prefixer] : [prefixer],
    });
  }, [direction]);

  useEffect(() => {
    document.body.setAttribute('dir', direction);
  }, [direction]);

  useEffect(() => {
    function setViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();

    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, [location]);

  useEffect(() => {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const browserName = browser.getBrowserName();

    dispatch(setBrowserName(browserName));

    console.log('Browser name:', browserName);

    if (browserName !== 'Chrome') {
      setIsChrome(false);
    }
  }, []);

  // useEffect(() => {
  //   initializeTensorFlow();
  // }, []);

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
  }, [dispatch]);

  useEffect(() => {
    const locale = localStorage.getItem('locale') || 'en';
    i18n.changeLanguage(locale);
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      const dir = i18n.dir(lng);
      setDirection(dir);
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
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
          dispatch(setUid(user?.uid));
          setUserDetails({ ...user });

          if (user?.email) {
            dispatch(setEmail(user?.email));
          } else {
            dispatch(setUserPhoneNumber(user?.phoneNumber));
          }

          setUserData({ ...user });
          console.log(user);

          // Re verifying the locale , translation and spoken language
          const storedLocale = localStorage.getItem('locale');
          if (user?.locale && !storedLocale) {
            localStorage.setItem('locale', user.locale);
            i18n.changeLanguage(user.locale);
          }

          const storedSpokenLang = localStorage.getItem('spokenLanguage');
          if (user?.spokenLanguage && !storedSpokenLang) {
            localStorage.setItem('spokenLanguage', user.spokenLanguage);
            dispatch(setLocalSpokenLanguage(user.spokenLanguage));
          }

          const storedTranslationLang = localStorage.getItem(
            'translationLanguagePreference',
          );
          if (user?.translationLanguage && !storedTranslationLang) {
            localStorage.setItem(
              'translationLanguagePreference',
              user.translationLanguage,
            );
            dispatch(setLocalTranslationLanguage(user.translationLanguage));
          }
        } else {
          dispatch(setUserName(null));
          dispatch(setUserPhoneNumber(null));
          dispatch(setEmail(null));
          dispatch(setUid(null));
        }
      } catch (error) {
        dispatch(setUserName(null));
        dispatch(setUserPhoneNumber(null));
        dispatch(setEmail(null));
        dispatch(setUid(null));

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

  useEffect(() => {
    if (socket && isSocketConnected && uid) {
      console.log('Registering UID on socket:', uid);
      socket.emit('registerUid', uid);
    }
  }, [socket, isSocketConnected, uid]);

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

  const AnimatedRoute = ({ element }) => {
    const location = useLocation();
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {element}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100vw', md: '430px' },
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <WebRTCBridge>
            <AudioTranscriptionProvider>
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    !isLocaleAndSpokenSet ? (
                      <AnimatedRoute element={<WelcomeScreen />} />
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
                    !isLocaleAndSpokenSet ? (
                      // If locale is not set, show the WelcomeScreen
                      <Navigate to="/" />
                    ) : !userData?.username ? (
                      // If locale is set and user not authenticated, show login
                      <AnimatedRoute element={<UserLogin />} />
                    ) : (
                      // If locale is set and user is authenticated, go to meeting
                      <Navigate to="/meeting" />
                    )
                  }
                />
                <Route path="/googleCallback" element={<GoogleCallback />} />
                <Route
                  path="/meeting"
                  element={
                    <ProtectedRoute>
                      <AnimatedRoute element={<CreateMeetingPage />} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/videocall/:meetingId"
                  element={
                    <ProtectedRoute>
                      <VideoCall />
                      {/* <AnimatedRoute element={<VideoCall />} /> */}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vibe/:practiceSessionId"
                  element={
                    <ProtectedRoute>
                      <AnimatedRoute element={<PracticeMain />} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meetingEnded"
                  element={<AnimatedRoute element={<MeetingEnded />} />}
                />
                <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
                <Route
                  path="/termsAndConditions"
                  element={<TermsAndCondition />}
                />
              </Routes>
            </AudioTranscriptionProvider>
          </WebRTCBridge>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
