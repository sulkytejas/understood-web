export const JOIN_MEETING = 'JOIN_MEETING';

export const joinMeeting = (meetingId) => ({
  type: JOIN_MEETING,
  payload: meetingId,
});
