import { useState } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import StyledTextField from './StyledTextField';
import GradientButton from './GradientButton';
import SolidButton from './SolidButton';
// Supplier
const SupplierForm = ({ onSetStage }) => {
  // Step state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Supplier Name or Url', 'Your Email'];

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    supplierName: '',
  });

  // Form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Close snackbar notification
  const handleCloseSnackbar = () => {
    setSubmitStatus((prev) => ({ ...prev, open: false }));
  };

  // Navigate to next step
  const handleNext = () => {
    // Validate current step
    if (activeStep === 1 && !formData.email) {
      setSubmitStatus({
        open: true,
        message: 'Please enter your email',
        severity: 'error',
      });
      return;
    }

    if (activeStep === 0 && !formData.supplierName) {
      setSubmitStatus({
        open: true,
        message: 'Please enter supplier name or URL',
        severity: 'error',
      });
      return;
    }

    // If we're on the last step, submit the form
    if (activeStep === steps.length - 1) {
      handleSubmit();
      return;
    }

    // Otherwise, move to next step
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Navigate to previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!formData.email || !formData.supplierName) {
      setSubmitStatus({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, submit to Google Sheets - replace with your actual script URL
      await fetch(
        'https://script.google.com/macros/s/AKfycbwuQaQ0conBVdumTowpi3Gnl08UzSJZX6RSR0tkjFWizi1HPNuLGSocyBdZqJ3lVrU/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            email: formData.email,
            supplierName: formData.supplierName,
            timestamp: new Date().toISOString(),
          }),
        },
      );

      // Show success message immediately
      setSubmitStatus({
        open: true,
        message: 'Your request has been sent successfully!',
        severity: 'success',
      });

      // Move to next stage immediately
      onSetStage(2);

      // Also send to backend (non-blocking)
      const apiUrl = process.env.REACT_APP_API_URL;
      fetch(`${apiUrl}/api/sendSupplierEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: formData.email,
          supplierName: formData.supplierName,
          supplierWebsite: 'n/a',
          concerns: 'n/a',
          emailSubject: "We've Received Your Vetting Request!",
          emailBody:
            'Thanks for requesting your free supplier vetting report! Our analyst is clearly reviewing your request and will send your personalized report soon.',
        }),
      }).catch((error) => {
        console.error('Error sending to backend:', error);
      });

      // Reset form
      setFormData({
        email: '',
        supplierName: '',
      });

      // Reset step
      setActiveStep(0);
    } catch (error) {
      console.error('Error submitting form:', error);

      // Still show success to user
      setSubmitStatus({
        open: true,
        message: 'Your request has been sent successfully!',
        severity: 'success',
      });

      // Move to next stage anyway
      onSetStage(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get content for current step
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Supplier Name
        return (
          <StyledTextField
            label="Supplier Name or Website"
            name="supplierName"
            value={formData.supplierName}
            onChange={handleChange}
            required
            placeholder="Supplier's Company Name or Url"
            autoFocus
          />
        );
      case 1: // Email
        return (
          <StyledTextField
            label="Your Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="yourname@example.com"
            autoFocus
          />
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 800,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        padding: { xs: '13px 13px 13px 17px', md: 'unset' },
        gap: 2,
        // Remove outlined border:
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        // Optional: remove default background
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '28px',
          fontWeight: 700,
          lineHeight: '38px',
          fontFamily: 'Exo 2',
          color: '#0C2617',
          paddingBottom: '15px',
          textTransform: 'uppercase',
          textAlign: 'left',
        }}
      >
        Request Your Free Supplier Vetting Report
      </Typography>

      {/* Step Title */}
      <Typography
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          fontFamily: 'Exo 2',
          color: '#0C2617',
          mb: 2,
        }}
      >
        Step {activeStep + 1}: {steps[activeStep]}
        {(activeStep === 0 || activeStep === 1) && ' (Required)'}
      </Typography>

      {/* Current step field */}
      {getStepContent(activeStep)}

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
        <SolidButton
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ height: '50px', color: '#fff !important' }}
          responsiveStyles={{
            borderColor: activeStep === 0 ? 'transparent' : 'inherit',
            minWidth: '100px',
          }}
        >
          Back
        </SolidButton>

        <GradientButton
          onClick={handleNext}
          disabled={isSubmitting}
          responsiveStyles={{
            padding: '8px 30px',
            minWidth: '100px',
            marginTop: '0px !important',
          }}
        >
          {isSubmitting ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress
                size={24}
                color="inherit"
                sx={{ position: 'absolute' }}
              />
              <span style={{ visibility: 'hidden' }}>
                {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
              </span>
            </Box>
          ) : activeStep === steps.length - 1 ? (
            'Submit'
          ) : (
            'Next'
          )}
        </GradientButton>
      </Box>

      {/* Status notification */}
      <Snackbar
        open={submitStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={submitStatus.severity}
          sx={{ width: '100%' }}
        >
          {submitStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupplierForm;
