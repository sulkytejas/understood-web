import React, { useState } from 'react';
import { Container, Paper, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/system';
// import { useSelector } from 'react-redux';

import HostControl from './HostControl';
import UserAvatar from './UserAvatar';
import ParticipantTab from './ParticipantTab';

// import { selectMeetingId } from '../../redux/meetingSlice';

const CreateMeetingPage = () => {
  const [activeTab, setActiveTab] = useState(0);

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

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} className="create-meeting-paper">
        <CustomTabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <CustomTab label="Host Meeting" />
          <CustomTab label="Join Meeting" />
        </CustomTabs>
        <div className="create-meeting-content">
          <UserAvatar />
        </div>

        {activeTab === 0 ? <HostControl /> : <ParticipantTab />}
      </Paper>
    </Container>
  );
};

export default CreateMeetingPage;
