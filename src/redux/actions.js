import { createAction } from '@reduxjs/toolkit';

export const cleanupState = createAction('CLEANUP_STATE');
export const meetingEndedCleanup = createAction('MEETING_ENDED_CLEANUP');
