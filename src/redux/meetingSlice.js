import { createSlice } from '@reduxjs/toolkit';
import { cleanupState, meetingEndedCleanup } from './actions';

const initialState = {
  pendingMeetingId: null,
  meetingId: null,
  hostSocketId: null,
  isHost: null,
  meetingPhrase: null,
  participantInfo: null,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setPendingMeetingId: (state, action) => {
      state.pendingMeetingId = action.payload;
    },
    joinMeeting: (state, action) => {
      state.meetingId = action.payload;
      state.pendingMeetingId = null;
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
    setParticipantInfo: (state, action) => {
      state.participantInfo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(meetingEndedCleanup, () => initialState)
      .addCase(cleanupState, () => initialState);
  },
});

export const {
  joinMeeting,
  setHostSocketId,
  setIsHost,
  setMeetingPhrase,
  setParticipantInfo,
  setPendingMeetingId,
} = meetingSlice.actions;
export const selectMeetingId = (state) => state.meeting.meetingId;

export default meetingSlice.reducer;
