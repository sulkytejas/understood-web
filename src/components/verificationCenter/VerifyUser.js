import {
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';

import WavyUnderlineText from './waveUnderlineText';
import StyledTextField from '../Vetting/StyledTextField';
import GradientButton from '../Vetting/GradientButton';

const VerifyUser = () => {
  const [formData, setFormData] = useState({
    uid: '',
    gstNumber: '',
    iecCode: '',
    udyamNumber: '',
    panNumber: '',
    uploadAddressProof: false,
    representativeAadhar: false,
    linkedinInstagramProfile: false,
    verifiedUser: '',
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

      console.log(response);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box
      sx={{
        padding: '50px 0',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Exo 2',
          fontSize: '48px',
          lineHeight: '140%',
          textTransform: 'uppercase',
          padding: '20px',
          color: '#0C2617',
          textAlign: 'center',
          mb: 4,
        }}
      >
        <WavyUnderlineText>Verify </WavyUnderlineText>{' '}
        <WavyUnderlineText>User </WavyUnderlineText>
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          px: 3,
        }}
      >
        {/* Text Fields */}
        <StyledTextField
          label="User UID"
          placeholder="Enter User UID"
          fullWidth
          required
          value={formData.uid}
          onChange={handleTextChange('uid')}
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
            sx={{
              px: 6,
              py: 1.5,
              fontFamily: 'Exo 2',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Submit Verification
          </GradientButton>
        </Box>
      </Box>
    </Box>
  );
};

export default VerifyUser;
