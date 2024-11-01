import { useState, useEffect } from 'react';

import {
  TextField,
  IconButton,
  Button,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import {
  joinMeeting,
  setHostSocketId,
  setIsHost,
  setMeetingPhrase,
} from '../../redux/meetingSlice';
import { useTranslation } from 'react-i18next';

import { setUserName } from '../../redux/userSlice';

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
      fontSize: '16px', // Font size for the input
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

const HostControl = ({
  onSetOpenSettingMenu,
  persistedUserName,
  phoneNumber,
  email,
  setActiveTab,
}) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const userSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const meetingPhraseRedux = useSelector(
    (state) => state.meeting.meetingPhrase,
  );
  // const navigate = useNavigate();

  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(persistedUserName);
  const [openTooltip, setOpenTooltip] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set a timeout to close the tooltip after 3 seconds (3000ms)
    const timer = setTimeout(() => {
      setOpenTooltip(false);
    }, 5000); // Adjust the time as needed

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  const createMeetingHandler = async () => {
    setLoading(true);

    if (socket) {
      socket.emit(
        'createMeeting',
        {
          phoneNumber,
          email,
          userSpokenLanguage,
        },
        ({ meetingId, hostSocketId, error, meetingPhrase }) => {
          if (error) {
            setError(error);
            setLoading(false);
            return;
          }

          console.log('Meeting created with ID:', meetingId);
          setMeetingId(meetingId);
          dispatch(joinMeeting(meetingId));
          dispatch(setHostSocketId(hostSocketId));
          dispatch(setIsHost(true));
          dispatch(setUserName(username));
          dispatch(setMeetingPhrase(meetingPhrase));
          setLoading(false);
          setActiveTab(1);
        },
      );

      if (username !== persistedUserName) {
        socket.emit('updateUsername', { username, phoneNumber, email });
      }

      // if (!error) {
      //   setActiveTab(1);
      // }
    } else {
      console.error('Socket not initialized');
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(meetingId).then(() => {
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
        <p className="host-control-title">{t('Host Meeting')} </p>

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
        placeholder={t('Meeting ID')}
        disabled
        variant="outlined"
        fullWidth
        margin="normal"
        value={meetingPhraseRedux}
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
      {error && <FormHelperText error>{error}</FormHelperText>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        className="create-invite-button"
        onClick={createMeetingHandler}
        sx={{ marginTop: '45px', color: '#fff', fontSize: '18px' }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          t('Create Meeting')
        )}
      </Button>
    </div>
  );
};

export default HostControl;
