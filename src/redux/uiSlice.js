import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  callMenuOpen: false,
  callSideMenu: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCallMenuOpen: (state, action) => {
      state.callMenuOpen = action.payload;
    },
    setCallSideMenu: (state, action) => {
      state.callSideMenu = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { setCallMenuOpen, setCallSideMenu } = uiSlice.actions;

export default uiSlice.reducer;
