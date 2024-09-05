import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  username: null,
  phoneNumber: null,
  email: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserName: (state, action) => {
      state.username = action.payload;
    },
    setUserPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { setUserName, setUserPhoneNumber, setEmail } = userSlice.actions;

export default userSlice.reducer;
