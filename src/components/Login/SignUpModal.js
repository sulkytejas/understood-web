import React, { useState, useCallback, useEffect } from 'react';
import { Button, Modal } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import {
  ModalContainer,
  ModalTitle,
  ModalSubtitle,
  OrText,
} from './Login.styles';
import { TextInput } from '../ui';

const SignUpModal = ({ open, handleClose }) => {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [email, setEmail] = useState('');
  const { t } = useTranslation();
  const { socket } = useSocket();

  const handleNotifyCTAClick = useCallback(async () => {
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
      setStatusMessage("Thanks for signing up! We'll keep you posted.");
    } catch (error) {
      setStatusMessage('An error occurred. Please try again later.');
    }
  }, [phone, email, socket]);

  useEffect(() => {
    const handleSubmissionStatus = (response) => {
      if (response.success) {
        setSubmitted(true);
        setStatusMessage(response.message);
      } else {
        setStatusMessage(response.message);
      }
    };

    socket.on('contactSubmissionStatus', handleSubmissionStatus);

    return () => {
      socket.off('contactSubmissionStatus', handleSubmissionStatus);
    };
  }, [socket]);

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
        <ModalContainer>
          {submitted ? (
            <ModalTitle variant="h6" color="textSecondary">
              {!statusMessage ? (
                <>
                  {t('Thanks for signing up!')}
                  <br />
                  {t('We’ll keep you posted.')}
                </>
              ) : (
                statusMessage
              )}
            </ModalTitle>
          ) : (
            <>
              <ModalTitle
                id="sign-up-modal"
                variant="h6"
                component="h2"
                gutterBottom
              >
                {t('Sign Up for Early Access')}
              </ModalTitle>
              <ModalSubtitle variant="body2" color="textSecondary" mb={2}>
                {t(
                  "Enter your phone number or email, and we'll reach out when we're ready!",
                )}
              </ModalSubtitle>
              <TextInput
                styleVariant="outlined"
                label="Phone (+ Country Code)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
              />
              <OrText variant="body2" color="textSecondary">
                {t('Or')}
              </OrText>
              <TextInput
                styleVariant="outlined"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                type="email"
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
        </ModalContainer>
      </Modal>
    </motion.div>
  );
};

export default SignUpModal;
