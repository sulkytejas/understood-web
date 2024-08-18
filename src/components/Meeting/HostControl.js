import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  TextField,
  IconButton,
  Button,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { joinMeeting, setHostId } from '../../redux/meetingSlice';

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

const HostControl = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const navigate = useNavigate();

  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);

  const createMeetingHandler = async () => {
    setLoading(true);

    if (socket) {
      socket.emit('createMeeting', {
        meetingTitle: 'My Meeting',
        userId: 'test',
      });

      socket.on('generatedMeetingId', ({ meetingId, hostSocketId }) => {
        console.log('generated createMeeting event');
        setMeetingId(meetingId);
        dispatch(joinMeeting(meetingId));
        dispatch(setHostId(hostSocketId));
        setLoading(false);
      });
    } else {
      console.error('Socket not initialized');
    }
  };

  const onClickJoin = () => {
    socket.emit('hostStartMeeting', meetingId);
    // Programmatically navigate to "/videocall"
    navigate('/videocall');
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(meetingId).then(() => {
      console.log('Text copied to clipboard!');
    });
  };

  return (
    <div>
      <p className="host-control-title"> Host Meeting </p>
      <CustomTextField
        placeholder="Add Meeting Title (Optional)"
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
        placeholder="Meeting ID"
        disabled
        variant="outlined"
        fullWidth
        margin="normal"
        value={meetingId}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <LinkIcon />
              </CustomIcon>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton disabled={!meetingId} onClick={handleCopyClick}>
                <CopyIcon color="action" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {meetingId ? (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          className="create-invite-button"
          onClick={onClickJoin}
          sx={{ marginTop: '80px', color: '#fff', fontSize: '18px' }}
        >
          Join
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          className="create-invite-button"
          onClick={createMeetingHandler}
          sx={{ marginTop: '80px', color: '#fff', fontSize: '18px' }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Create Meeting'
          )}
        </Button>
      )}
    </div>
  );
};

export default HostControl;
