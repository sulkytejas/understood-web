import React, { useState } from 'react';
import { Button, Box, CircularProgress, FormHelperText } from '@mui/material';
import { styled } from '@mui/system';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Link as LinkIcon } from '@mui/icons-material';

// Styled TextField, same style as in your HostControl
const CustomTextField = styled(TextField)({
  backgroundColor: '#F9F9F9',
  marginTop: 10,
  borderRadius: '0px',
  borderBottom: '1px solid #A0A0A0',
  '& .MuiOutlinedInput-root': {
    padding: '0px',
    '& fieldset': {
      border: 'none',
    },
    display: 'flex',
    alignItems: 'center',
    '& input': {
      height: '48px',
      boxSizing: 'border-box',
      lineHeight: '22px',
      fontSize: '16px',
      color: '#000000',
      '&.Mui-disabled': {
        color: '#707070',
        opacity: 0.8,
        '-webkit-text-fill-color': '#000',
      },
    },
    '& input::placeholder': {
      color: '#000',
      opacity: 0.8,
    },
  },
  '& .MuiInputAdornment-root': {
    marginRight: '10px',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 2,
  },
});

const CustomIcon = styled('div')({
  color: '#5abcc9',
  backgroundColor: '#DFEBFF',
  padding: '4px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
});

function ApiCheckLink() {
  const [api1, setApi1] = useState('');
  const [api2, setApi2] = useState('');

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  const [result1, setResult1] = useState('');
  const [result2, setResult2] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL;

  // Separate checker for API 1
  const handleCheckAPI1 = async () => {
    setLoading1(true);
    setError1(null);
    setResult1('');

    try {
      const supplierName = encodeURIComponent(api1.trim());

      const response1 = await fetch(
        `${apiUrl}/api/trustSupplier?supplierName=${supplierName}`,
      );

      if (!response1.ok) {
        setResult1(`Error: ${response1.status}`);
      } else {
        setResult1(JSON.stringify(await response1.json()));
      }
    } catch (err) {
      console.error(err);
      setError1('Something went wrong checking API 1');
    } finally {
      setLoading1(false);
    }
  };

  // Separate checker for API 2
  const handleCheckAPI2 = async () => {
    setLoading2(true);
    setError2(null);
    setResult2('');

    const productName = encodeURIComponent(api2.trim());

    try {
      if (api2.trim()) {
        const response2 = await fetch(
          `${apiUrl}/api/productPrice?productName=${productName}`,
        );

        if (!response2.ok) {
          setResult2(`Error: ${response2.status}`);
        } else {
          setResult2(JSON.stringify(await response2.json()));
        }
      }
    } catch (err) {
      console.error(err);
      setError2('Something went wrong checking API 2');
    } finally {
      setLoading2(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <h2>API Check Link</h2>

      {/* API 1 field */}
      <CustomTextField
        placeholder="Supplier Name"
        value={api1}
        onChange={(e) => setApi1(e.target.value)}
        variant="outlined"
        fullWidth
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <LinkIcon />
              </CustomIcon>
            </InputAdornment>
          ),
        }}
      />
      {error1 && <FormHelperText error>{error1}</FormHelperText>}

      <Box sx={{ p: 1, border: '1px solid #ddd', mt: 1 }}>
        {result1 ? result1 : 'Result will appear here...'}
      </Box>

      {/* Button to check API 1 */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, fontSize: '16px', color: '#fff' }}
        onClick={handleCheckAPI1}
        disabled={loading1}
      >
        {loading1 ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Check Trust Score'
        )}
      </Button>

      {/* API 2 field */}
      <CustomTextField
        placeholder="Product Price Comparison"
        value={api2}
        onChange={(e) => setApi2(e.target.value)}
        variant="outlined"
        fullWidth
        margin="normal"
        sx={{ mt: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CustomIcon>
                <LinkIcon />
              </CustomIcon>
            </InputAdornment>
          ),
        }}
      />
      {error2 && <FormHelperText error>{error2}</FormHelperText>}

      <Box sx={{ p: 1, border: '1px solid #ddd', mt: 1 }}>
        {result2 ? result2 : 'Result will appear here...'}
      </Box>

      {/* Button to check API 2 */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, fontSize: '16px', color: '#fff' }}
        onClick={handleCheckAPI2}
        disabled={loading2}
      >
        {loading2 ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Compare Market Price'
        )}
      </Button>
    </Box>
  );
}

export default ApiCheckLink;
