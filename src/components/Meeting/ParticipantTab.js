import React, { useState } from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import { Videocam } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

import { joinMeeting } from '../../redux/meetingSlice';
import { useSocket } from '../context/SocketContext';

const CustomTextField = styled(TextField)({
  backgroundColor: '#F9F9F9',
  borderRadius: '8px',
  '& .MuiOutlinedInput-root': {
    padding: '8px',
    '& fieldset': {
      border: 'none', // Remove the default border
    },
    display: 'flex',
    alignItems: 'center',
    '& input': {
      height: '48px', // Set a fixed height for the input
      boxSizing: 'border-box', // Ensure padding is included in the height
      lineHeight: '48px', // Align text vertically
      padding: '0 12px', // Adjust padding inside the input
      fontSize: '16px', // Font size for the input
      color: '#000000',
      '&.Mui-disabled': {
        color: '#000',
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
    marginRight: '8px',
    display: 'flex',
    alignItems: 'center',
  },
});

const CustomIcon = styled('div')({
  color: '#5abcc9',
  backgroundColor: '#DFEBFF',
  padding: '8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center', // Vertically center the icon inside the box
  justifyContent: 'center',
});

const ParticipantTab = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const navigate = useNavigate();

  const [meetingId, setMeetingId] = useState(null);

  const onClickHandler = () => {
    dispatch(joinMeeting(meetingId));
    socket.emit('joinMeeting', meetingId);
    navigate('/videocall');
  };

  return (
    <div>
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
        sx={{ marginTop: '80px', color: '#fff', fontSize: '18px' }}
      >
        Join
      </Button>
    </div>
  );
};

export default ParticipantTab;
