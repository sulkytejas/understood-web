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
import { TextInput, useTextInput, validators } from '../ui';

// Example of SignUpModal using the useTextInput hook
const SignUpModalWithHook = ({ open, handleClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { t } = useTranslation();
  const { socket } = useSocket();

  // Using the useTextInput hook with validation
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
  } = useTextInput(
    {
      phone: '',
      email: '',
    },
    {
      phone: [
        validators.pattern(/^\+?[\d\s()-]+$/, 'Invalid phone format'),
        validators.minLength(10, 'Phone number too short'),
      ],
      email: [validators.email('Please enter a valid email address')],
    },
  );

  const handleNotifyCTAClick = useCallback(async () => {
    // Validate all fields
    if (!validateAll()) {
      return;
    }

    // At least one field should be filled
    if (!values.phone && !values.email) {
      return;
    }

    socket.emit('submitContact', values);

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbwrQxv5VsUR2VvthlFR-b-qWjXgs4k4KyzgKmwICjawcFJAonuaXGZhvnSOb33aunH4BQ/exec',
        {
          method: 'POST',
          body: JSON.stringify({
            email: values.email,
            phoneNumber: values.phone,
          }),
        },
      );
      reset();
      setSubmitted(true);
      setStatusMessage("Thanks for signing up! We'll keep you posted.");
    } catch (error) {
      setStatusMessage('An error occurred. Please try again later.');
    }
  }, [values, validateAll, socket, reset]);

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
                  {t("We'll keep you posted.")}
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
                value={values.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={touched.phone && !!errors.phone}
                helperText={touched.phone && errors.phone}
                margin="normal"
                placeholder="+1 (555) 123-4567"
              />
              <OrText variant="body2" color="textSecondary">
                {t('Or')}
              </OrText>
              <TextInput
                styleVariant="outlined"
                label="Email"
                value={values.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && !!errors.email}
                helperText={touched.email && errors.email}
                margin="normal"
                type="email"
                placeholder="you@example.com"
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleNotifyCTAClick}
                sx={{ mt: 2, color: '#fff' }}
                disabled={
                  (!values.phone && !values.email) ||
                  (touched.phone && errors.phone) ||
                  (touched.email && errors.email)
                }
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

export default SignUpModalWithHook;
