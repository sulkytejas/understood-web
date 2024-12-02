import { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/system';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { useLocation, useNavigate } from 'react-router-dom';

import HostControl from './HostControl';
// import UserAvatar from './UserAvatar';
import ParticipantTab from './ParticipantTab';
import VibeModeTab from './VibeModeTab';
import AccountSeetingDialog from './AccountSettingDialog';
import { ReactComponent as LogoIcon } from '../assets/understood_logo.svg';

import { setLocalSpokenLanguage } from '../../redux/translationSlice';
import {
  joinMeeting,
  setHostSocketId,
  setIsHost,
  setMeetingPhrase,
} from '../../redux/meetingSlice';
import LoadingSpinner from '../onBoarding/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const CustomTabs = styled(Tabs)({
  '& .MuiTabs-indicator': {
    display: 'none', // Hide the default indicator
  },
  '& .MuiTabs-scroller': {
    padding: '0 5px', // Add padding to the scroller
  },
});

const CustomTab = styled(Tab)({
  backgroundColor: '#F1F0F0',
  minHeight: 'auto',
  textTransform: 'none',
  padding: '10px 20px',
  fontSize: 14,
  color: '#000000',
  transition: 'all 0.3s ease',
  zIndex: 0,
  boxShadow: 'none', // No shadow for non-selected tabs
  fontWeight: 400,
  '&.Mui-selected': {
    backgroundColor: '#ffffff', // Background for the selected tab
    boxShadow: '1px 2px 8px rgba(0, 0, 0, 0.4)',
    color: '#000000',
    // transform: 'translateY(-2px)', // Make the selected tab appear raised
    zIndex: 1, // Ensure it appears above other tabs
    borderBottom: 'none',
  },
});

const CustomTabDark = styled(Tab)({
  backgroundColor: '#A9A9A9',
  minHeight: 'auto',
  textTransform: 'none',
  padding: '10px 20px',
  fontSize: 14,
  color: '#FFF',
  transition: 'all 0.3s ease',
  zIndex: 0,
  boxShadow: 'none', // No shadow for non-selected tabs
  fontWeight: 400,
  '&.Mui-selected': {
    backgroundColor: '#000', // Background for the selected tab
    boxShadow: '1px 2px 8px rgba(0, 0, 0, 0.4)',
    color: '#fff',
    // transform: 'translateY(-2px)', // Make the selected tab appear raised
    zIndex: 1, // Ensure it appears above other tabs
    borderBottom: 'none',
  },
});

const StyledLogoBox = styled(Box)(() => ({
  marginBottom: '40px',
  marginTop: '40px',
  zIndex: 2,
  textAlign: 'center',
}));

const CreateMeetingPage = () => {
  const dispatch = useDispatch();
  const { socket, isSocketConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState(0);
  const meetingId = useSelector((state) => state.meeting.meetingId);
  const persistedUserName = useSelector((state) => state.user.username);
  const phoneNumber = useSelector((state) => state.user.phoneNumber);
  const localSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const userUid = useSelector((state) => state.user.uid);

  const email = useSelector((state) => state.user.email);
  const [openSettingMenu, setOpenSettingMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(location.search);
  const urlMeetingId = urlParams.get('meetingId');

  const handleSettingClose = (languageCode) => {
    setOpenSettingMenu(false);
    if (languageCode) {
      dispatch(setLocalSpokenLanguage(languageCode));
    }
  };

  useEffect(() => {
    if (meetingId) {
      setActiveTab(1);
    }
  }, [meetingId]);

  useEffect(() => {
    if (socket && isSocketConnected) {
      if (urlMeetingId) {
        dispatch(joinMeeting(urlMeetingId));
        navigate(location.pathname, { replace: true });
      } else {
        socket.emit(
          'getActiveMeetings',
          { phoneNumber, email, userSpokenLanguage: localSpokenLanguage },
          ({ meetingId, hostSocketId, meetingPhrase }) => {
            console.log('Meeting old ID:', meetingId);

            if (meetingId) {
              dispatch(joinMeeting(meetingId));
            }

            if (meetingPhrase) {
              dispatch(setMeetingPhrase(meetingPhrase));
            }

            if (hostSocketId) {
              dispatch(setHostSocketId(hostSocketId));
              dispatch(setIsHost(true));
            }
          },
        );
      }
      setLoading(false);
    }
  }, [socket, isSocketConnected, dispatch, urlMeetingId, navigate]);

  useEffect(() => {
    if (socket && isSocketConnected) {
      socket.emit('registerUid', userUid);
    }
  }, [userUid, socket]);

  if (loading) {
    console.log('Loading spinner on create meeting page');
    return <LoadingSpinner />;
  }

  return (
    <Box
      sx={{
        margin: '16px',
      }}
    >
      <StyledLogoBox>
        <LogoIcon style={{ width: 40, height: 40 }} />
        {/* Adjust size as needed */}
      </StyledLogoBox>

      <CustomTabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <CustomTab label={t('Host ')} />
        <CustomTab label={t('Join')} />
        <CustomTabDark label={t('Vibe')} />
      </CustomTabs>
      <div className="create-meeting-content">{/* <UserAvatar /> */}</div>

      {activeTab === 0 && (
        <HostControl
          onSetOpenSettingMenu={setOpenSettingMenu}
          persistedUserName={persistedUserName}
          phoneNumber={phoneNumber}
          email={email}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 1 && (
        <ParticipantTab
          onSetOpenSettingMenu={setOpenSettingMenu}
          persistedUserName={persistedUserName}
          phoneNumber={phoneNumber}
          email={email}
        />
      )}

      {activeTab === 2 && (
        <VibeModeTab
          onSetOpenSettingMenu={setOpenSettingMenu}
          persistedUserName={persistedUserName}
          phoneNumber={phoneNumber}
          email={email}
        />
      )}

      <AccountSeetingDialog
        open={openSettingMenu}
        onClose={handleSettingClose}
      />
    </Box>
  );
};

export default CreateMeetingPage;
