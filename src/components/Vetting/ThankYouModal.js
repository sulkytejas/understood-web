import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GradientButton from './GradientButton';

const ThankYouModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          position: 'relative',
          overflow: 'visible',
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: '#5A6D62',
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
        {/* Success Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: { xs: 60, md: 80 },
              color: '#3DB141',
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: { xs: '32px', md: '48px' },
            fontWeight: 700,
            fontFamily: 'Exo 2',
            color: '#0C2617',
            mb: 2,
            textTransform: 'uppercase',
          }}
        >
          Thank You!
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: { xs: '16px', md: '20px' },
            fontWeight: 400,
            fontFamily: 'Jost',
            color: '#5A6D62',
            mb: 4,
            lineHeight: '140%',
          }}
        >
          Welcome to the beta! Youve secured your free year of access.
        </Typography>

        {/* Message */}
        {/* <Box
          sx={{
            backgroundColor: '#F8FBF5',
            borderRadius: '16px',
            p: 3,
            mb: 4,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '14px', md: '16px' },
              fontFamily: 'Jost',
              color: '#5A6D62',
              lineHeight: '160%',
            }}
          >
            Well send you an email with your login details and next steps. Get
            ready to simplify your sourcing and stop bleeding margin!
          </Typography>
        </Box> */}

        {/* Slot Counter */}
        {/* <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '24px', md: '32px' },
              fontWeight: 700,
              fontFamily: 'Exo 2',
              color: '#0C2617',
            }}
          >
            14/50
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '14px', md: '16px' },
              fontWeight: 400,
              fontFamily: 'Jost',
              color: '#5A6D62',
            }}
          >
            slots remaining
          </Typography>
        </Box> */}

        {/* CTA Button */}
        <GradientButton
          onClick={onClose}
          variant="contained"
          responsiveStyles={{
            marginTop: '5px',
            maxWidth: '250px',
            fontSize: '20px',
            padding: '10px 20px 10px 20px',
            alignSelf: 'center',
          }}
        >
          Got it!
        </GradientButton>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouModal;
