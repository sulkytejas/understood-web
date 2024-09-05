import { useState, useEffect } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/system';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';

import HostControl from './HostControl';
import UserAvatar from './UserAvatar';
import ParticipantTab from './ParticipantTab';
import AccountSeetingDialog from './AccountSettingDialog';
import { ReactComponent as LogoIcon } from '../assets/understood_logo.svg';

import { setLocalSpokenLanguage } from '../../redux/translationSlice';
import { joinMeeting } from '../../redux/meetingSlice';
import LoadingSpinner from '../onBoarding/LoadingSpinner';

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

const StyledLogoBox = styled(Box)(() => ({
  marginBottom: '40px',
  marginTop: '40px',
  zIndex: 2,
  textAlign: 'center',
}));

const CreateMeetingPage = () => {
  const dispatch = useDispatch();
  const { socket, isSocketConnected } = useSocket();

  const [activeTab, setActiveTab] = useState(0);
  const meetingId = useSelector((state) => state.meeting.meetingId);
  const persistedUserName = useSelector((state) => state.user.username);
  const phoneNumber = useSelector((state) => state.user.phoneNumber);
  const email = useSelector((state) => state.user.email);
  const [openSettingMenu, setOpenSettingMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  console.log(email, persistedUserName, 'persistedUserName');
  const handleSettingClose = (languageCode) => {
    setOpenSettingMenu(false);
    dispatch(setLocalSpokenLanguage(languageCode));
  };

  useEffect(() => {
    if (meetingId) {
      setActiveTab(1);
    }
  }, [meetingId]);

  useEffect(() => {
    if (socket && isSocketConnected) {
      console.log('getActiveMeetings');
      socket.emit(
        'getActiveMeetings',
        { phoneNumber, email },
        ({ meetingId }) => {
          console.log(meetingId, 'meetingId');
          if (meetingId) {
            dispatch(joinMeeting(meetingId));
          }

          setLoading(false);
        },
      );
    }
  }, [socket, isSocketConnected, phoneNumber, email, dispatch]);

  if (loading) {
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
        <CustomTab label="Host Meeting" disabled={!!meetingId} />
        <CustomTab label="Join Meeting" />
      </CustomTabs>
      <div className="create-meeting-content">
        <UserAvatar />
      </div>

      {activeTab === 0 ? (
        <HostControl
          onSetOpenSettingMenu={setOpenSettingMenu}
          persistedUserName={persistedUserName}
          phoneNumber={phoneNumber}
          email={email}
        />
      ) : (
        <ParticipantTab
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
