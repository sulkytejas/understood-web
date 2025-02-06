import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Typography,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Check } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { getCountriesList } from '../utils/countriesConfig';
import { setLocalSpokenLanguage } from '../../redux/translationSlice';
import i18n from '../../i18n';
import { cleanupState } from '../../redux/actions';
import { useNavigate } from 'react-router-dom';

function AccountSettingDialog(props) {
  const { onClose, open, selectedValue } = props;
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Current preferences from store/localStorage
  const localSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const userUid = useSelector((state) => state.user.uid);

  // Load current locale from localStorage or default
  const [currentLocale, setCurrentLocale] = React.useState(
    localStorage.getItem('locale') || 'en',
  );
  const [selectedSpokenLanguage, setSelectedSpokenLanguage] = React.useState(
    localSpokenLanguage || 'en-US',
  );

  // Track which section is expanded: "spoken", "locale", or null if none
  const [expandedSection, setExpandedSection] = React.useState(null);

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleOk = () => {
    // Save spoken language
    localStorage.setItem('spokenLanguage', selectedSpokenLanguage);
    dispatch(setLocalSpokenLanguage(selectedSpokenLanguage));

    // Save locale
    localStorage.setItem('locale', currentLocale);
    i18n.changeLanguage(currentLocale);

    // If you also store locale in DB after login, you can emit an event or call an API here.
    socket.emit('updateLanguages', {
      uid: userUid,
      spokenLanguage: selectedSpokenLanguage,
      locale: currentLocale,
    });

    onClose(selectedValue);
  };

  const handleLogout = async () => {
    try {
      const apiURL = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiURL}/api/logout`, {
        method: 'POST',
        credentials: 'include', // ensures cookies are sent
      });

      if (response.ok) {
        console.log('Logout successful');
        dispatch(cleanupState());
        navigate('/login');
        onClose();
      } else {
        console.error('Failed to log out.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const countries = getCountriesList();

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle
        sx={{
          fontSize: '16px',
          color: '#707070',
          lineHeight: '22px',
          textTransform: 'capitalize',
        }}
      >
        {t('account settings')}
      </DialogTitle>

      <DialogContent dividers>
        {/* Spoken Language Title */}
        <Typography
          variant="subtitle1"
          sx={{
            cursor: 'pointer',
            fontWeight: 'bold',
            mb: expandedSection === 'spoken' ? 1 : 2,
          }}
          onClick={() => toggleSection('spoken')}
        >
          {t('Change Spoken Language')}
        </Typography>
        {expandedSection === 'spoken' && (
          <Box sx={{ mb: 2 }}>
            <List aria-label="spoken-language" name="spokenLanguage">
              {countries.map((option) => (
                <ListItem
                  disableGutters
                  key={option.spokenName || option.name}
                  sx={{ display: 'flex' }}
                >
                  <ListItemButton
                    disableGutters
                    onClick={() => setSelectedSpokenLanguage(option.speechCode)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: '#4abbc9',
                          color: '#fff',
                          height: 24,
                          width: 24,
                          marginRight: 2,
                          fontSize:
                            option.languageCode === 'zh-CN' ? '12px' : '14px',
                        }}
                      >
                        {option.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={t(option.spokenName || option.name)}
                    />
                    {option.speechCode === selectedSpokenLanguage && (
                      <Check
                        sx={{
                          height: '30px',
                          width: '28px',
                          marginRight: '20px',
                          color: '#4abbc9',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Locale Title */}
        <Typography
          variant="subtitle1"
          sx={{
            cursor: 'pointer',
            fontWeight: 'bold',
            mb: expandedSection === 'locale' ? 1 : 2,
            textTransform: 'capitalize',
          }}
          onClick={() => toggleSection('locale')}
        >
          {t('change app language')}
        </Typography>
        {expandedSection === 'locale' && (
          <Box sx={{ mb: 2 }}>
            <List aria-label="locale" name="locale">
              {countries.map((option) => (
                <ListItem disableGutters key={option.name}>
                  <ListItemButton
                    disableGutters
                    onClick={() => setCurrentLocale(option.locale)}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: '#4abbc9',
                          color: '#fff',
                          height: 24,
                          width: 24,
                          marginRight: 2,
                          fontSize:
                            option.languageCode === 'zh-CN' ? '12px' : '14px',
                        }}
                      >
                        {option.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={t(option.name)} />
                    {option.locale === currentLocale && (
                      <Check
                        sx={{
                          height: '30px',
                          width: '28px',
                          marginRight: '20px',
                          color: '#4abbc9',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ textTransform: 'uppercase' }}>
        <Button color="error" onClick={handleLogout}>
          {t('logout')}
        </Button>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button onClick={handleOk}>{t('ok')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AccountSettingDialog;
