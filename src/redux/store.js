import { configureStore } from '@reduxjs/toolkit';
import meetingReducer from './meetingSlice';
import translationReducer from './translationSlice';
import uiReducer from './uiSlice';
import userReducer from './userSlice';
import videoPlayerReducer from './videoPlayerSlice';

const store = configureStore({
  reducer: {
    meeting: meetingReducer,
    translation: translationReducer,
    ui: uiReducer,
    user: userReducer,
    videoPlayer: videoPlayerReducer,
  },
});

export default store;
