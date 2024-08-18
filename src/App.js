/* eslint-disable */

import './App.css';
import { useState } from 'react';
import { Button } from '@mui/material';
import { SocketProvider } from './components/context/SocketContext';
import { Routes, Route } from 'react-router-dom';
// import VideoCall from './components/VideoCall';
import VideoCall from './components/VideoCall/VideoCall';
// import BroadcastVid from './components/BroadcastVid';
import CreateMeetingPage from './components/Meeting/CreateMeeting';

function App() {
  return (
    <div className="App app-container">
      <SocketProvider>
        <Routes>
          <Route path="/" element={<CreateMeetingPage />} />
          <Route path="/videocall" element={<VideoCall />} />
        </Routes>
      </SocketProvider>
    </div>
  );
}

export default App;
