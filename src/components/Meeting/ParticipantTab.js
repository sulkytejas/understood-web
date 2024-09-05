import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  InputAdornment,
  Box,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Videocam,
  Settings as SettingsIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { styled } from '@mui/system';
import { useWebRTC } from '../context/WebrtcContext';
import { useSocket } from '../context/SocketContext';
import {
  joinMeeting,
  setHostSocketId,
  setIsHost,
} from '../../redux/meetingSlice';
import { useNavigate } from 'react-router-dom';

// import { useSocket } from '../context/SocketContext';

const CustomTextField = styled(TextField)({
  backgroundColor: '#F9F9F9',
  marginTop: 10,
  borderRadius: '0px',
  borderBottom: '1px solid #A0A0A0',
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

const ParticipantTab = ({
  onSetOpenSettingMenu,
  persistedUserName,
  phoneNumber,
  email,
}) => {
  // const socket = useSocket();
  const [meetingId, setMeetingId] = useState(null);
  const [username, setUsername] = useState(persistedUserName);

  const reduxmeetingId = useSelector((state) => state.meeting.meetingId);
  const { joinRoom } = useWebRTC();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();

  useEffect(() => {
    if (reduxmeetingId) {
      setMeetingId(reduxmeetingId);
    }
  }, [reduxmeetingId]);

  const onClickHandler = async () => {
    console.log('clicked');
    const { joined, hostSocketId, isHost } = await joinRoom(meetingId);
    console.log('clicked', joined, hostSocketId, isHost);

    if (joined) {
      dispatch(joinMeeting(meetingId));
      dispatch(setHostSocketId(hostSocketId));
      dispatch(setIsHost(isHost));

      if (username !== persistedUserName) {
        socket.emit('updateUsername', { username, phoneNumber, email });
      }

      navigate(`/videocall/${meetingId}`);
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(meetingId).then(() => {
      console.log('Text copied to clipboard!');
    });
  };

  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: '18px',
          // padding: '8px 16px', // Adjust padding as needed
        }}
      >
        <p className="host-control-title"> Join Meeting </p>
        <IconButton aria-label="settings" edge="end">
          <SettingsIcon
            sx={{ color: ' #DF4303' }}
            onClick={() => onSetOpenSettingMenu((prev) => !prev)}
          />
        </IconButton>
      </Box>

      <CustomTextField
        placeholder="Add Username"
        value={username && username !== 'new_user' ? username : null}
        onChange={(e) => setUsername(e.target.value)}
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
        value={reduxmeetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <Videocam />
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
