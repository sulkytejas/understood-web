import logo from './logo.svg';
import './App.css';
import { useState } from 'react';
import { Button } from '@mui/material';

// import VideoCall from './components/VideoCall';
import VideoCall from './components/VideoCall/VideoCall';
import BroadcastVid from './components/BroadcastVid';

function App() {
  const [mode,setMode] = useState(null);

  return (
    <div className="App app-container">
      {!mode && <Button onClick={() => setMode('single')}>Single User</Button>}
      {!mode && <Button onClick={() => setMode('broadcast')}> Broadcast</Button>}
      { mode === 'single' && <VideoCall />}
      { mode === 'broadcast' && <BroadcastVid />}

    </div>
  );
}

export default App;
