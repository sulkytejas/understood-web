import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  meetingId: null,
  hostId: null,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    joinMeeting: (state, action) => {
      state.meetingId = action.payload;
    },
    setHostId: (state, action) => {
      state.hostId = action.payload;
    },
  },
});

export const { joinMeeting, setHostId } = meetingSlice.actions;
export const selectMeetingId = (state) => state.meeting.meetingId;

export default meetingSlice.reducer;
