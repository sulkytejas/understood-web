import { configureStore } from '@reduxjs/toolkit';
import meetingReducer from './meetingSlice';
import translationReducer from './translationSlice';
import uiReducer from './uiSlice';

const store = configureStore({
  reducer: {
    meeting: meetingReducer,
    translation: translationReducer,
    ui: uiReducer,
  },
});

export default store;
