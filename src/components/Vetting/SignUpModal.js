import React, { useState } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import StyledTextField from './StyledTextField';
import GradientButton from './GradientButton';

const SignUpModal = ({ isOpenSignUpModal, setIsOpenSignUpModal }) => {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  const handleClose = () => setIsOpenSignUpModal(false);

  const handleSubmit = async () => {
    const formData = {
      // name: event.target.name.value,
      // email: event.target.email.value,
      // message: event.target.message.value,
      email,
      description,
    };

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbwrQxv5VsUR2VvthlFR-b-qWjXgs4k4KyzgKmwICjawcFJAonuaXGZhvnSOb33aunH4BQ/exec',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
      );
      setEmail('');
      setDescription('');
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Modal
      open={isOpenSignUpModal}
      onClose={handleClose}
      aria-labelledby="custom-modal-title"
      aria-describedby="custom-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          outline: 'none',
          textAlign: 'center',
          width: { xs: '100%', md: 'unset' },
          maxWidth: '800px',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>

        {/* Modal Content */}
        <Typography
          id="custom-modal-title"
          variant="h6"
          component="h2"
          sx={{
            fontFamily: 'Exo 2, sans-serif',
            fontWeight: 700,
            fontSize: '36px',
            lineHeight: '50.4px',
          }}
        >
          Have Questions? Get In Touch!
        </Typography>
        <Typography
          id="custom-modal-description"
          sx={{
            fontFamily: "'Jost', 'sans-serif'",
            fontSize: '20px',
            lineHeight: '28.9px',
          }}
        >
          Enter your email and question below—we’ll clearly get back to you
          within 24 hours.
        </Typography>

        <Box sx={{ padding: '40px 0 20px 0' }}>
          <Box
            sx={{
              display: 'flex',
              gap: '25px',
              flexDirection: { xs: 'column', md: 'column' },
            }}
          >
            <StyledTextField
              fullWidth
              variant="filled"
              label="Email"
              onChange={(event) => setEmail(event.target.value)}
              //   sx={{ width: "100%" }}
            />
            <StyledTextField
              fullWidth
              variant="filled"
              label="Your question or message here"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              //   sx={{ width: "100%" }}
            />
            <Typography
              sx={{
                fontFamily: "'Jost', 'sans-serif'",
                fontSize: '20px',
                lineHeight: '28.9px',
                textAlign: 'center',
                fontWeight: 400,
                fontColor: '#5A6D62',
                alignSelf: 'center',
                padding: '0 5px',
                opacity: 0.5,
              }}
            ></Typography>
          </Box>
          <Box>
            <GradientButton
              variant="contained"
              color="secondary"
              onClick={() => handleSubmit()}
              sx={{
                padding: '11px 30px 14px 30px !important',
              }}
            >
              Send Message
            </GradientButton>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default SignUpModal;
