import {
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';

import StyledTextField from '../Vetting/StyledTextField';
import GradientButton from '../Vetting/GradientButton';

const VerificationLevelTwo = () => {
  const [formData, setFormData] = useState({
    userIdentification: '',
    videoIntroductionVerified: false,
    facilityAndCatalogVerified: false,
    facilitySummary: '',
    tradeDataVerified: false,
    tradeDataSummary: '',
    revenueVerified: false,
    revenueSummary: '',
    certificationsVerified: false,
    certificateDetails: '',
    yearsInBusiness: '',
    dnbNumber: '',
    lowMoqFriendly: '',
    privateLabelCapability: '',
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
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

  const handleRadioChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const apiUrl = process.env.REACT_APP_API_URL;

    try {
      const response = await fetch(`${apiUrl}/api/verify/two`, {
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
          message: 'Level 2 verification completed successfully!',
          severity: 'success',
        });
      } else {
        // Handle different error cases
        let errorMessage = 'Level 2 verification failed. Please try again.';

        if (data.message === 'User not found') {
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

  const renderCheckboxWithTextArea = (
    checkboxField,
    textAreaField,
    checkboxLabel,
    textAreaLabel,
  ) => (
    <Box sx={{ mb: 3 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData[checkboxField]}
            onChange={handleCheckboxChange(checkboxField)}
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
        label={checkboxLabel}
        sx={{
          '& .MuiFormControlLabel-label': {
            fontFamily: 'Exo 2',
            color: '#0C2617',
            ml: 1,
          },
        }}
      />
      {textAreaField && (
        <TextField
          label={textAreaLabel}
          multiline
          rows={3}
          fullWidth
          value={formData[textAreaField]}
          onChange={handleTextChange(textAreaField)}
          sx={{
            mt: 2,
            '& .MuiInputBase-root': {
              fontFamily: 'Exo 2',
            },
            '& .MuiInputLabel-root': {
              fontFamily: 'Exo 2',
              color: '#0C2617',
            },
          }}
        />
      )}
    </Box>
  );

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
      {/* User/Company Identification */}
      <StyledTextField
        label="User Username or Company Name"
        placeholder="Enter Username or Company Name"
        fullWidth
        required
        value={formData.userIdentification}
        onChange={handleTextChange('userIdentification')}
      />

      {/* Video Introduction */}
      {renderCheckboxWithTextArea(
        'videoIntroductionVerified',
        null,
        'Video Introduction Verified',
        null,
      )}

      {/* Facility and Catalog */}
      {renderCheckboxWithTextArea(
        'facilityAndCatalogVerified',
        'facilitySummary',
        'Facility and Catalog Verified',
        'Facility Summary',
      )}

      {/* Trade Data */}
      {renderCheckboxWithTextArea(
        'tradeDataVerified',
        'tradeDataSummary',
        'Trade Data Verified',
        'Trade Data Summary',
      )}

      {/* Revenue */}
      {renderCheckboxWithTextArea(
        'revenueVerified',
        'revenueSummary',
        'Revenue Documents Verified',
        'Revenue Summary',
      )}

      {/* Certifications */}
      {renderCheckboxWithTextArea(
        'certificationsVerified',
        'certificateDetails',
        'Certifications Verified',
        'Certificate Details',
      )}

      {/* Years in Business */}
      <StyledTextField
        label="Years in Business"
        placeholder="Enter number of years"
        type="number"
        fullWidth
        required
        value={formData.yearsInBusiness}
        onChange={handleTextChange('yearsInBusiness')}
        inputProps={{ min: 0 }}
      />

      {/* D&B Number */}
      <StyledTextField
        label="D&B Number"
        placeholder="Enter D&B Number"
        fullWidth
        value={formData.dnbNumber}
        onChange={handleTextChange('dnbNumber')}
      />

      {/* Low MOQ Friendly */}
      <Box sx={{ mt: 1 }}>
        <Typography
          sx={{
            fontFamily: 'Exo 2',
            color: '#0C2617',
            mb: 1,
            fontWeight: 500,
          }}
        >
          Low MOQ Friendly
        </Typography>
        <RadioGroup
          row
          value={formData.lowMoqFriendly}
          onChange={handleRadioChange('lowMoqFriendly')}
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

      {/* Private Label Capability */}
      <Box sx={{ mt: 1 }}>
        <Typography
          sx={{
            fontFamily: 'Exo 2',
            color: '#0C2617',
            mb: 1,
            fontWeight: 500,
          }}
        >
          Private Label Capability
        </Typography>
        <RadioGroup
          row
          value={formData.privateLabelCapability}
          onChange={handleRadioChange('privateLabelCapability')}
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
          {loading ? 'Submitting...' : 'Submit Level 2 Verification'}
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

export default VerificationLevelTwo;
