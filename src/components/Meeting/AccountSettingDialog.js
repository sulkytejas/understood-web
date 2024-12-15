import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Check } from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { getCountriesList } from '../utils/countriesConfig';

function AccountSeetingDialog(props) {
  const { onClose, selectedValue, open } = props;
  const { socket } = useSocket();
  const { t } = useTranslation();
  const localSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const userUid = useSelector((state) => state.user.uid);

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value) => {
    onClose(value);
    localStorage.setItem('spokenLanguage', value);
    socket.emit('updateLanguages', { uid: userUid, spokenLanguage: value });
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle
        sx={{
          fontSize: '16px',
          color: '#707070',
          lineHeight: '22px',
        }}
      >
        {t('Change Spoken Language')}
      </DialogTitle>
      <List sx={{ pt: 0 }}>
        {getCountriesList().map((option) => (
          <ListItem disableGutters key={option.name}>
            <ListItemButton
              onClick={() => handleListItemClick(option.languageCode)}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: '#4abbc9',
                    color: '#fff',
                    height: 24,
                    width: 24,
                    marginRight: 2,
                    fontSize: option.languageCode === 'zh-CN' ? '12px' : '14px',
                  }}
                >
                  {option.avatar}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={option.name} />
            </ListItemButton>

            {option.languageCode === localSpokenLanguage && (
              <Check
                sx={{
                  height: '30px',
                  width: '28px',
                  marginRight: '20px',
                  color: '#4abbc9',
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

export default AccountSeetingDialog;
