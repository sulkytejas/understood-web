import React, { useState } from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import { Add as AddIcon, Videocam } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

import { joinMeeting } from '../../redux/meetingSlice';

const CustomTextField = styled(TextField)({
  backgroundColor: '#F9F9F9',
  marginTop: 10,
  borderRadius: '0px',
  '& .MuiOutlinedInput-root': {
    padding: '0px',
    '& fieldset': {
      border: 'none', // Remove the default border
    },
    display: 'flex',
    alignItems: 'center',
    '& input': {
      height: '48px', // Set a fixed height for the input
      boxSizing: 'border-box', // Ensure padding is included in the height
      lineHeight: '22px', // Align text vertically
      fontSize: '12px', // Font size for the input
      color: '#000000',
      '&.Mui-disabled': {
        color: '#707070',
        opacity: 0.8,
        '-webkit-text-fill-color': '#000',
      },
    },
    '& input::placeholder': {
      color: '#000', // Placeholder text color
      opacity: 0.8, // Ensure the color is applied (overrides browser default opacity)
    },
  },
  '& .MuiInputAdornment-root': {
    marginRight: '10px',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 2,
  },
});

const CustomIcon = styled('div')({
  color: '#5abcc9',
  backgroundColor: '#DFEBFF',
  padding: '4px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center', // Vertically center the icon inside the box
  justifyContent: 'center',
  width: 20,
  height: 20,
});

const ParticipantTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [meetingId, setMeetingId] = useState(null);

  const onClickHandler = () => {
    dispatch(joinMeeting(meetingId));
    navigate('/videocall');
  };

  return (
    <div>
      <p className="host-control-title"> Join Meeting </p>
      <CustomTextField
        placeholder="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <AddIcon />
              </CustomIcon>
            </InputAdornment>
          ),
        }}
      />
      <CustomTextField
        placeholder="Insert Meeting ID"
        variant="outlined"
        fullWidth
        margin="normal"
        onChange={(e) => setMeetingId(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <Videocam />
              </CustomIcon>
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        className="create-invite-button"
        onClick={onClickHandler}
        disabled={!meetingId}
        sx={{ marginTop: '45px', color: '#fff', fontSize: '18px' }}
      >
        Join
      </Button>
    </div>
  );
};

export default ParticipantTab;
