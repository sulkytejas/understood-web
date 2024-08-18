import { configureStore } from '@reduxjs/toolkit';
import meetingReducer from './meetingSlice';

const store = configureStore({
  reducer: {
    meeting: meetingReducer,
  },
});

export default store;
