import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  meetingId: null,
  hostSocketId: null,
  isHost: null,
  meetingPhrase: null,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    joinMeeting: (state, action) => {
      state.meetingId = action.payload;
    },
    setHostSocketId: (state, action) => {
      state.hostSocketId = action.payload;
    },
    setIsHost: (state, action) => {
      state.isHost = action.payload;
    },
    setMeetingPhrase: (state, action) => {
      state.meetingPhrase = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { joinMeeting, setHostSocketId, setIsHost, setMeetingPhrase } =
  meetingSlice.actions;
export const selectMeetingId = (state) => state.meeting.meetingId;

export default meetingSlice.reducer;
