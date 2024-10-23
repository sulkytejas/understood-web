import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  callMenuOpen: false,
  callSideMenu: false,
  browserName: null,
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
    setBrowserName: (state, action) => {
      state.browserName = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { setCallMenuOpen, setCallSideMenu, setBrowserName } =
  uiSlice.actions;

export default uiSlice.reducer;
