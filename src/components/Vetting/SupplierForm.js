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

const SupplierForm = ({ onSetStage }) => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    supplierName: '',
    supplierWebsite: '',
    concerns: '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate required fields
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
      const apiUrl = process.env.REACT_APP_API_URL;

      const response = await fetch(`${apiUrl}/api/sendSupplierEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: formData.email,
          supplierName: formData.supplierName,
          supplierWebsite: formData.supplierWebsite,
          concerns: formData.concerns,
          // Email template information
          emailSubject: "We've Received Your Vetting Request!",
          emailBody:
            'Thanks for requesting your free supplier vetting report! Our analyst is clearly reviewing your request and will send your personalized report within 24 hours.',
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Show success message
      setSubmitStatus({
        open: true,
        message: 'Your request has been sent successfully!',
        severity: 'success',
      });

      // Move to next stage if provided
      onSetStage(2);

      // Reset form
      setFormData({
        email: '',
        supplierName: '',
        supplierWebsite: '',
        concerns: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        open: true,
        message:
          'There was an error submitting your request. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      noValidate
      autoComplete="off"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        padding: { xs: '13px ', md: 'unset' },
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
          paddingBottom: '40px',
          textTransform: 'uppercase',
          textAlign: 'left',
        }}
      >
        Request Your Free Supplier Vetting Report
      </Typography>

      {/* 1. Your Email (required) */}
      <StyledTextField
        label="Your Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        placeholder="yourname@example.com"
      />

      {/* 2. Supplier Name (required) */}
      <StyledTextField
        label="Supplier Name"
        name="supplierName"
        value={formData.supplierName}
        onChange={handleChange}
        required
        placeholder="Supplier's Company Name"
      />

      {/* 3. Supplier Website or Link (optional) */}
      <StyledTextField
        label="Supplier Website or Link"
        name="supplierWebsite"
        value={formData.supplierWebsite}
        onChange={handleChange}
        placeholder="https://supplierwebsite.com"
      />

      {/* 4. Specific Concerns or Checks You Want (optional) */}
      <StyledTextField
        label="Specific Concerns or Checks You Want"
        name="concerns"
        value={formData.concerns}
        onChange={handleChange}
        placeholder="Any particular concerns? (e.g., reliability, certifications, financial health)"
        multiline
        rows={3}
      />

      <GradientButton
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        responsiveStyles={{
          padding: '8px 30px ',
          marginTop: 30,
          maxWidth: '200px',
          alignSelf: 'left',
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
            <span style={{ visibility: 'hidden' }}>Submit</span>
          </Box>
        ) : (
          'Submit'
        )}
      </GradientButton>

      {/* Status notification */}
      <Snackbar
        open={submitStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
