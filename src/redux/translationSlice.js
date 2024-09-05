import { createSlice } from '@reduxjs/toolkit';
import { cleanupState } from './actions';

const initialState = {
  localTranslationLanguage: null,
  remoteTranslationLanguage: null,
  localSpokenLanguage: null,
  remoteSpokenLanguage: null,
};

const translationSlice = createSlice({
  name: 'translation',
  initialState,
  reducers: {
    setLocalTranslationLanguage: (state, action) => {
      state.localTranslationLanguage = action.payload;
    },
    setRemoteLanguage: (state, action) => {
      state.remoteTranslationLanguage = action.payload;
    },
    setLocalSpokenLanguage: (state, action) => {
      console.log('action.payload', action.payload);
      state.localSpokenLanguage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cleanupState, () => initialState);
  },
});

export const { setLocalTranslationLanguage, setLocalSpokenLanguage } =
  translationSlice.actions;

export default translationSlice.reducer;
