import {
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';

import StyledTextField from '../Vetting/StyledTextField';
import GradientButton from '../Vetting/GradientButton';

const VerificationLevelOne = () => {
  const [formData, setFormData] = useState({
    userIdentification: '',
    gstNumber: '',
    iecCode: '',
    udyamNumber: '',
    panNumber: '',
    uploadAddressProof: false,
    representativeAadhar: false,
    linkedinInstagramProfile: false,
    verifiedUser: '',
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error' | 'warning' | 'info'
  });

  const handleTextChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleRadioChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      verifiedUser: event.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await fetch(`${apiUrl}/api/verify/one`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === 'success') {
        setAlert({
          open: true,
          message: 'User verification completed successfully!',
          severity: 'success',
        });

        // Optionally reset form after successful submission
        // setFormData({ ...initialFormData });
      } else {
        // Handle different error cases
        let errorMessage = 'Verification failed. Please try again.';

        if (data.message === 'User not verified') {
          errorMessage =
            'User verification failed. Please ensure all requirements are met.';
        } else if (data.message === 'User not found') {
          errorMessage =
            'User not found. Please check the username or company name.';
        } else if (data.error) {
          errorMessage = `Error: ${data.error}`;
        }

        setAlert({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    } catch (e) {
      console.error(e);
      setAlert({
        open: true,
        message: 'Network error. Please check your connection and try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert({ ...alert, open: false });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        px: 3,
        py: 3,
      }}
    >
      {/* Text Fields */}
      <StyledTextField
        label="User Username or Company Name"
        placeholder="Enter Username or Company Name"
        fullWidth
        required
        value={formData.userIdentification}
        onChange={handleTextChange('userIdentification')}
      />

      <StyledTextField
        label="GST Number"
        placeholder="Enter GST Number"
        fullWidth
        required
        value={formData.gstNumber}
        onChange={handleTextChange('gstNumber')}
      />

      <StyledTextField
        label="IEC Code Requirement"
        placeholder="Enter IEC Code"
        fullWidth
        required
        value={formData.iecCode}
        onChange={handleTextChange('iecCode')}
      />

      <StyledTextField
        label="Udyam Number"
        placeholder="Enter Udyam Number"
        fullWidth
        required
        value={formData.udyamNumber}
        onChange={handleTextChange('udyamNumber')}
      />

      <StyledTextField
        label="PAN Number"
        placeholder="Enter PAN Number"
        fullWidth
        required
        value={formData.panNumber}
        onChange={handleTextChange('panNumber')}
      />

      {/* Checkboxes */}
      <Stack spacing={2} sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.uploadAddressProof}
              onChange={handleCheckboxChange('uploadAddressProof')}
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
          label="Upload Address Proof Verfied"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontFamily: 'Exo 2',
              color: '#0C2617',
              ml: 1,
            },
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.representativeAadhar}
              onChange={handleCheckboxChange('representativeAadhar')}
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
          label="Representative Aadhar Verified"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontFamily: 'Exo 2',
              color: '#0C2617',
              ml: 1,
            },
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.linkedinInstagramProfile}
              onChange={handleCheckboxChange('linkedinInstagramProfile')}
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
          label="LinkedIn and/or Instagram Profile Verfied"
          sx={{
            '& .MuiFormControlLabel-label': {
              fontFamily: 'Exo 2',
              color: '#0C2617',
              ml: 1,
            },
          }}
        />

        {/* Verified User - Yes/No Radio Buttons */}
        <Box sx={{ mt: 1 }}>
          <Typography
            sx={{
              fontFamily: 'Exo 2',
              color: '#0C2617',
              mb: 1,
              fontWeight: 500,
            }}
          >
            Verified User
          </Typography>
          <RadioGroup
            row
            value={formData.verifiedUser}
            onChange={handleRadioChange}
          >
            <FormControlLabel
              value="yes"
              control={
                <Radio
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
              label="Yes"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontFamily: 'Exo 2',
                  color: '#0C2617',
                  ml: 1,
                },
                mr: 4,
              }}
            />
            <FormControlLabel
              value="no"
              control={
                <Radio
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
              label="No"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontFamily: 'Exo 2',
                  color: '#0C2617',
                  ml: 1,
                },
              }}
            />
          </RadioGroup>
        </Box>
      </Stack>

      {/* Submit Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <GradientButton
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            px: 6,
            py: 1.5,
            fontFamily: 'Exo 2',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </GradientButton>
      </Box>

      {/* Snackbar for alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerificationLevelOne;
