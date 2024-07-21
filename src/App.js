import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

import VideoCall from './components/VideoCall';

function App() {
  console.log("running app")
  return (
    <div className="App app-container">
   
      <VideoCall/>
    
      
    </div>
  );
}

export default App;
