import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  videoPause: false,
  audioPause: false,
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
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { setVideoPause, setAudioPause } = videoPlayerSlice.actions;

export default videoPlayerSlice.reducer;
