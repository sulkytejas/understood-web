import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';

import GradientButton from './GradientButton';
import StyledTextField from './StyledTextField';
import ThankYouModal from './ThankYouModal';

function BetaForm({ onSetIsFormSubmitted }) {
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    CompanyName: '',
    email: '',
    soucrcingChallenge: '',
  });

  const [errors, setErrors] = useState({
    email: '',
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    const { fullName, CompanyName, email, soucrcingChallenge } = formData;

    const allFieldsFilled =
      fullName.trim() !== '' &&
      CompanyName.trim() !== '' &&
      email.trim() !== '' &&
      soucrcingChallenge.trim() !== '';

    const emailValid = validateEmail(email);

    // Added checkbox check here
    setIsFormValid(allFieldsFilled && emailValid && isChecked);
  }, [formData, isChecked]);

  const onSubmitHandler = async () => {
    if (!isFormValid) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/sendSupplierEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Email: formData.email,
          Lead_Name: formData.fullName,
          Company: formData.CompanyName,
          Sourcing_Challenge: formData.soucrcingChallenge,
          Lead_Source: 'Website',
        }),
      });
      if (response.status === 200) {
        localStorage.setItem('signUp_form_submitted', 'true');
        onSetIsFormSubmitted(true);
        setShowThankYouModal(true);
        setFormData({
          fullName: '',
          CompanyName: '',
          email: '',
          soucrcingChallenge: '',
        });
      }
    } catch (error) {
      console.error('Error sending to backend:', error);
    }
  };

  const handleCloseModal = () => {
    setShowThankYouModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: 'Please enter a valid email address',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: '',
        }));
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: { sm: '340px', md: '400px', lg: '420px', xl: '514px' },
        borderRadius: '30px',
        p: 3,
        // backgroundColor: 'white',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Exo 2',
          textAlign: 'center',
          fontSize: { xs: '20px', lg: '32px' },
          lineHeight: '100%',
          color: '#0C2617',
          fontWeight: 700,
          paddingTop: '20px',
          paddingBottom: '25px',
          marginBottom: '0',
        }}
        mb={3}
      >
        COUNT ME IN!
      </Typography>

      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <StyledTextField
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Full Name"
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
        />
        <StyledTextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Email"
          error={!!errors.email}
          helperText={errors.email}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
        />

        <StyledTextField
          label="Company Name"
          name="CompanyName"
          value={formData.CompanyName}
          onChange={handleChange}
          required
          placeholder="Company Name"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
        />

        <StyledTextField
          label="What are your Sourcing challenges?"
          name="soucrcingChallenge"
          value={formData.soucrcingChallenge}
          onChange={handleChange}
          multiline
          rows={4}
          required
          placeholder="What are your Sourcing challenges?"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              icon={
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    border: '2px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                  }}
                />
              }
              checkedIcon={
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    background:
                      'linear-gradient(90deg, #4ABBC9 0%, #ACEE5C 50%, #3DB141 100%)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
              }
            />
          }
          label="I'd like to join the beta list for Understood Connect"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontWeight: '400',
              fontFamily: 'Jost',
              fontSize: { xs: '14px', lg: '16px' },
              color: '#5A6D62',
            },
          }}
        />

        <GradientButton
          responsiveStyles={{
            marginTop: '5px',
            maxWidth: '250px',
            fontSize: '20px',
            padding: '10px 20px 10px 20px',
            alignSelf: 'center',
          }}
          disabled={!isFormValid}
          onClick={() => onSubmitHandler()}
        >
          Get 1 Year Free
        </GradientButton>
      </Box>
      <ThankYouModal open={showThankYouModal} onClose={handleCloseModal} />
    </Paper>
  );
}

export default BetaForm;
