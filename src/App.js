/* eslint-disable */

import './App.css';
import { useState } from 'react';
import { Box } from '@mui/material';
import { SocketProvider } from './components/context/SocketContext';
import { Routes, Route } from 'react-router-dom';
// import VideoCall from './components/VideoCall';
import VideoCall from './components/VideoCall/VideoCall';
// import BroadcastVid from './components/BroadcastVid';
import CreateMeetingPage from './components/Meeting/CreateMeeting';
import UserLogin from './components/Login/UserLogin';
import GoogleCallback from './components/Login/GoogleCallback';

function App() {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        height: '100vh',
        padding: '16px',
        margin: '0 auto',
        boxSizing: 'border-box',
        '@media (min-width:430px)': {
          padding: '0px',
          maxWidth: '430px', // Adjust this value according to the desired width for iPhone 15 Pro Max
        },
        '@media (min-width:768px)': {
          maxWidth: '768px', // For tablets and larger devices
        },
      }}
    >
      <SocketProvider>
        <Routes>
          <Route path="/parked" element={<UserLogin />} />
          <Route path="/googleCallback" element={<GoogleCallback />} />
          <Route path="/" element={<CreateMeetingPage />} />
          <Route path="/videocall" element={<VideoCall />} />
        </Routes>
      </SocketProvider>
    </Box>
  );
}

export default App;
