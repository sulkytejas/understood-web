import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  InputAdornment,
  Box,
  IconButton,
  FormHelperText,
  Typography,
  Tooltip,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
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
import { useTranslation } from 'react-i18next';

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
  const [error, setError] = useState(null);
  const [openTooltip, setOpenTooltip] = useState(true);

  const reduxmeetingId = useSelector((state) => state.meeting.meetingId);
  const { joinRoom } = useWebRTC();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { t } = useTranslation();

  useEffect(() => {
    // Set a timeout to close the tooltip after 3 seconds (3000ms)
    const timer = setTimeout(() => {
      setOpenTooltip(false);
    }, 5000); // Adjust the time as needed

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  useEffect(() => {
    if (reduxmeetingId) {
      setMeetingId(reduxmeetingId);
    }
  }, [reduxmeetingId]);

  const onClickHandler = async () => {
    try {
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
    } catch (e) {
      console.log(e, 'err err');
      setError(e?.error);
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Join meeting with following link:')} ${encodeURIComponent(`https://www.myunderstood.com/meeting?meetingId=${meetingId}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(meetingId).then(() => {
      console.log('Text copied to clipboard!');
    });
  };

  const handleCopyShare = () => {
    navigator.clipboard
      .writeText(`https://www.myunderstood.com/meeting?meetingId=${meetingId}`)
      .then(() => {
        console.log('Text copied to clipboard!');
      });
  };

  const tooltipTitle = t('Language and settings');

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
        <Tooltip title={tooltipTitle} open={openTooltip} placement="top" arrow>
          <IconButton
            aria-label="settings"
            edge="end"
            onClick={() => onSetOpenSettingMenu((prev) => !prev)}
          >
            <SettingsIcon sx={{ color: ' #DF4303' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <CustomTextField
        placeholder={t('Add Username')}
        value={username && username !== 'new_user' ? username : ''}
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
        placeholder={t('Insert Meeting ID')}
        variant="outlined"
        fullWidth
        margin="normal"
        value={meetingId || ''}
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
      {error && <FormHelperText error>{error}</FormHelperText>}

      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '22px',
          textAlign: 'center',
        }}
      >
        {t('Share Link via')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconButton
          onClick={handleWhatsAppShare}
          aria-label="Share on WhatsApp"
          sx={{
            backgroundColor: '#DFEBFF',
            margin: '5px',
          }}
        >
          <WhatsAppIcon style={{ color: '#25D366' }} />
        </IconButton>

        {/* Link Copy Button */}
        <IconButton
          onClick={handleCopyShare}
          aria-label="Copy Link"
          sx={{
            backgroundColor: '#DFEBFF',
            margin: '5px',
          }}
        >
          <LinkIcon />
        </IconButton>
      </Box>
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
