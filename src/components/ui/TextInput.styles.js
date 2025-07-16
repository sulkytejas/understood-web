import { styled } from '@mui/material/styles';
import TextInput from './TextInput';

// Pre-configured TextInput variants
export const LoginTextInput = styled(TextInput)({
  '& .MuiInputBase-root': {
    backgroundColor: '#F9F9F9',
    marginTop: '10px',
    borderRadius: '0px',
  },
});

export const PhoneTextInput = styled(TextInput)({
  '& .MuiInputBase-root': {
    backgroundColor: '#F9F9F9',
    height: '48px',
    '& input': {
      fontFamily: 'Exo 2',
      fontSize: '16px',
      color: '#000000',
      padding: '0 10px',
    },
  },
});

export const OtpTextInput = styled(TextInput)({
  '& .MuiInputBase-root': {
    backgroundColor: '#f5f5f5',
  },
  '& .MuiInputBase-input': {
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 500,
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#DF4303',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DF4303',
    },
  },
});

export const SearchTextInput = styled(TextInput)({
  '& .MuiInputBase-root': {
    borderRadius: '20px',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
});

// Utility function to create custom styled TextInputs
export const createStyledTextInput = (customStyles) => {
  return styled(TextInput)(customStyles);
};
