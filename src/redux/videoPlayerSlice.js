import { createSlice } from '@reduxjs/toolkit';
import { cleanupState, meetingEndedCleanup } from './actions';

const initialState = {
  videoPause: false,
  audioPause: false,
  localAudioOnly: false,
  remoteAudioOnly: false,
};

const videoPlayerSlice = createSlice({
  name: 'videoPlayer',
  initialState,
  reducers: {
    setVideoPause: (state, action) => {
      console.log('video pause', action.payload);
      state.videoPause = action.payload;
    },
    setAudioPause: (state, action) => {
      state.audioPause = action.payload;
    },
    setlocalAudioOnly: (state, action) => {
      state.localAudioOnly = action.payload;
    },
    setRemoteAudioOnly: (state, action) => {
      state.remoteAudioOnly = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(meetingEndedCleanup, () => initialState)
      .addCase(cleanupState, () => initialState);
  },
});

export const {
  setVideoPause,
  setAudioPause,
  setRemoteAudioOnly,
  setlocalAudioOnly,
} = videoPlayerSlice.actions;

export default videoPlayerSlice.reducer;
