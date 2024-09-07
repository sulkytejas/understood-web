import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { blue } from '@mui/material/colors';
import { useTranslation } from 'react-i18next';

function AccountSeetingDialog(props) {
  const { onClose, selectedValue, open } = props;
  const { t } = useTranslation();

  const countries = [
    { code: 'IN', languageCode: 'hi-Hi', name: t('Hindi') },
    { code: 'US', languageCode: 'en-US', name: t('English') },
    { code: 'RU', languageCode: 'ru-RU', name: t('Russian') },
    // Add more countries as needed
  ];

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value) => {
    onClose(value);
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
        {countries.map((option) => (
          <ListItem disableGutters key={option.name}>
            <ListItemButton
              onClick={() => handleListItemClick(option.languageCode)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                  <img
                    loading="lazy"
                    srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                    src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                    alt={option.name}
                    style={{ width: 24, height: 24 }}
                  />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={option.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
}

export default AccountSeetingDialog;
