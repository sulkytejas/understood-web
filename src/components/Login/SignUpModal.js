import React, { useState } from 'react';
import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';

const SignUpModal = ({ open, handleClose }) => {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [email, setEmail] = useState('');
  const { t } = useTranslation();
  const { socket } = useSocket();

  const handleNotifyCTAClick = async () => {
    // Emit the contact information to the server

    socket.emit('submitContact', { phone, email });

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbwrQxv5VsUR2VvthlFR-b-qWjXgs4k4KyzgKmwICjawcFJAonuaXGZhvnSOb33aunH4BQ/exec',
        {
          method: 'POST',
          body: JSON.stringify({ email, phoneNumber: phone }),
        },
      );
      setEmail('');
      setPhone('');
      setSubmitted(true);
      setStatusMessage('Thanks for signing up! We’ll keep you posted.');
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatusMessage('An error occurred. Please try again later.');
    }

    // Listen for the response from the server
    socket.on('contactSubmissionStatus', (response) => {
      if (response.success) {
        setSubmitted(true);
        setStatusMessage(response.message);
      } else {
        setStatusMessage(response.message);
      }
    });
  };

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };
  const pageTransition = {
    duration: 0.3,
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Modal open={open} onClose={handleClose} aria-labelledby="sign-up-modal">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          {submitted ? (
            <Typography variant="h6" color="textSecondary" align="center">
              {!statusMessage ? (
                <>
                  {t('Thanks for signing up!')}
                  <br />
                  {t('We’ll keep you posted.')}
                </>
              ) : (
                statusMessage
              )}
            </Typography>
          ) : (
            <>
              <Typography
                id="sign-up-modal"
                variant="h6"
                component="h2"
                gutterBottom
                sx={{ textAlign: 'center' }}
              >
                {t('Sign Up for Early Access')}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                mb={2}
                sx={{ textAlign: 'center' }}
              >
                {t(
                  "Enter your phone number or email, and we'll reach out when we're ready!",
                )}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                label="Phone (+ Country Code)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
              />
              <Typography
                variant="body2"
                color="textSecondary"
                mb={2}
                sx={{ textAlign: 'center', margin: '8px 0' }}
              >
                {t('Or')}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleNotifyCTAClick}
                sx={{ mt: 2, color: '#fff' }}
              >
                {t('Notify Me')}
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </motion.div>
  );
};

export default SignUpModal;
