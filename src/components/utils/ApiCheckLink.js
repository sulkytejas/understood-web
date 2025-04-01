import React, { useState } from 'react';
import {
  Button,
  Box,
  CircularProgress,
  FormHelperText,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/system';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { Link as LinkIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

// New styled components for the formatted display
const ResultContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: '1px solid #ddd',
  marginTop: theme.spacing(1),
  borderRadius: 4,
  backgroundColor: '#f9f9f9',
  minHeight: '100px',
  maxHeight: '300px',
  overflowY: 'auto',
}));

// const DataCard = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(2),
//   backgroundColor: '#fff',
//   marginBottom: theme.spacing(2),
//   boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
// }));

const DataSection = styled(Box)({
  marginBottom: '12px',
});

const Label = styled(Typography)({
  fontWeight: 500,
  fontSize: '14px',
  color: '#666',
});

const Value = styled(Typography)({
  fontWeight: 600,
  fontSize: '16px',
  color: '#333',
});

// const CountLabel = styled(Typography)({
//   fontSize: '12px',
//   color: '#888',
//   fontStyle: 'italic',
// });

// Format price with 2 decimal places and currency symbol
const formatPrice = (price, isIndia = false) => {
  if (price === undefined || price === null) return 'N/A';

  // Handle small and large numbers differently
  if (price < 1000) {
    return `${isIndia ? '₹' : '$'}${Number(price).toFixed(2)}`;
  } else {
    // Format larger numbers with commas
    return `$${Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const showRawJson = (jsonData) => {
  try {
    const formatted =
      typeof jsonData === 'string'
        ? jsonData
        : JSON.stringify(jsonData, null, 2);
    return (
      <Box
        component="pre"
        sx={{
          margin: 0,
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
        }}
      >
        {formatted}
      </Box>
    );
  } catch (err) {
    return <Typography color="error">Error displaying data</Typography>;
  }
};

// Component to display Trust Score data
const TrustScoreDisplay = ({ data }) => {
  if (!data) return <Typography>No data available</Typography>;

  // Fallback function to show raw JSON if display fails

  let trustData;
  try {
    // If data is a string, parse it
    trustData = typeof data === 'string' ? JSON.parse(data) : data;

    // Check different possible data structures
    // First check for trustScore structure
    if (trustData.trustScore) {
      // Original expected structure
      const { trustScore } = trustData;
      return renderTrustData(trustScore, trustData.source);
    }
    // Check for supplier structure (as shown in the screenshot)
    else if (trustData.supplier) {
      const { supplier } = trustData;
      // Try to extract analysis, strengths, weaknesses either from supplier or trustData
      const analysis = supplier.analysis || trustData.analysis;
      const strengths = supplier.strengths || trustData.strengths;
      const weaknesses = supplier.weaknesses || trustData.weaknesses;

      return renderTrustData(
        {
          trust_score: supplier.trust_score,
          analysis,
          strengths,
          weaknesses,
        },
        trustData.source,
      );
    }
    // Otherwise, fallback to raw JSON
    else {
      console.log('Trust data structure not as expected:', trustData);
      return showRawJson(data);
    }
  } catch (error) {
    console.error('Error parsing trust data:', error);
    return showRawJson(data);
  }
};

// Function to render trust data with the given details
const renderTrustData = (trustDetails, source) => {
  // Extract score and other details
  const { trust_score, analysis, strengths, weaknesses } = trustDetails;

  // Determine score color based on value (using the requested thresholds)
  const getScoreColor = (score) => {
    if (score > 60) return '#4caf50'; // green
    if (score >= 40) return '#FFC107'; // yellow (changed from orange)
    return '#f44336'; // red
  };

  const scoreColor = getScoreColor(trust_score);

  // Format section for strengths or weaknesses
  const renderPointsList = (title, points, icon, color) => {
    if (!points || !Array.isArray(points) || points.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color,
            display: 'flex',
            alignItems: 'center',
            mb: 1,
          }}
        >
          {icon && (
            <Box component="span" sx={{ mr: 1 }}>
              {icon}
            </Box>
          )}
          {title}
        </Typography>
        <Box component="ul" sx={{ pl: 3, mt: 0 }}>
          {points.map((point, index) => (
            <Box
              component="li"
              key={index}
              sx={{
                mb: 0.5,
                listStyleType: 'disc',
              }}
            >
              {point}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  try {
    return (
      <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
        {/* Trust Score Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid #eee',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Supplier Trust Score
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: `4px solid ${scoreColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff',
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', color: scoreColor }}
              >
                {trust_score}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              out of 100
            </Typography>
          </Box>
        </Box>

        {/* Analysis */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#37474f' }}>
            Analysis
          </Typography>
          <Typography
            sx={{
              lineHeight: 1.6,
              textAlign: 'justify',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
            }}
          >
            {analysis}
          </Typography>
        </Box>

        {/* Strengths & Weaknesses */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#f0f8f0', height: '100%' }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: '#2e7d32',
                  borderBottom: '1px solid #c8e6c9',
                  pb: 1,
                }}
              >
                Strengths
              </Typography>
              {renderPointsList('', strengths, '✓', '#2e7d32')}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#fff8f0', height: '100%' }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  color: '#ed6c02',
                  borderBottom: '1px solid #ffe0b2',
                  pb: 1,
                }}
              >
                Areas for Improvement
              </Typography>
              {renderPointsList('', weaknesses, '!', '#ed6c02')}
            </Paper>
          </Grid>
        </Grid>

        {/* Source Information */}
        {source && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#666' }}>
              Source: {source}
            </Typography>
          </Box>
        )}
      </Box>
    );
  } catch (error) {
    console.error('Error rendering trust score display:', error);
    return showRawJson(trustDetails);
  }
};

// Component to render price data
const PriceDataDisplay = ({ data }) => {
  if (!data) return <Typography>No data available</Typography>;

  // Fallback function to show raw JSON if formatted display fails
  const showRawJson = (jsonData) => {
    try {
      const formatted =
        typeof jsonData === 'string'
          ? jsonData
          : JSON.stringify(jsonData, null, 2);
      return (
        <Box
          component="pre"
          sx={{
            margin: 0,
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {formatted}
        </Box>
      );
    } catch (err) {
      return <Typography color="error">Error displaying data</Typography>;
    }
  };

  // Process the data to handle different possible structures
  const processData = (inputData) => {
    try {
      // Parse if it's a string
      const parsed =
        typeof inputData === 'string' ? JSON.parse(inputData) : inputData;

      // Check if data has a "matches" array (from the example JSON)
      if (
        parsed.matches &&
        Array.isArray(parsed.matches) &&
        parsed.matches.length > 0
      ) {
        return parsed.matches;
      }

      // If it's already an array, return it
      if (Array.isArray(parsed)) {
        return parsed;
      }

      // If it's a single item with pricing info, wrap it in an array
      if (parsed.chinaWholesalePrice || parsed.indiaWholesalePrice) {
        return [parsed];
      }

      console.log('Unknown data structure:', parsed);
      return [parsed]; // Wrap in array as fallback
    } catch (error) {
      console.error('Error processing data:', error);
      return [];
    }
  };

  // Get data items to render
  let dataItems = [];
  try {
    dataItems = processData(data);
  } catch (error) {
    console.error('Error in data processing:', error);
    return showRawJson(data);
  }

  // Render a single price section (now as part of an accordion)
  const renderPriceSection = (
    title,
    priceSection,
    expanded = false,
    isIndia = false,
  ) => {
    if (!priceSection) return null;

    // Safety check for required properties
    const hasRequiredProps =
      priceSection &&
      typeof priceSection === 'object' &&
      (priceSection.min !== undefined ||
        priceSection.max !== undefined ||
        priceSection.median !== undefined);

    if (!hasRequiredProps) {
      return (
        <Accordion defaultExpanded={expanded}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 'bold', color: '#2c5282' }}>
              {title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="textSecondary">Incomplete data</Typography>
            {showRawJson(priceSection)}
          </AccordionDetails>
        </Accordion>
      );
    }

    // Number of sources (displayed but not in the detailed data)
    const sourcesInfo = priceSection.sourceCounts
      ? `(${priceSection.sourceCounts.total} sources)`
      : '';

    return (
      <Accordion defaultExpanded={expanded}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            background: '#f5f8fb',
            borderBottom: '1px solid #edf2f7',
          }}
        >
          <Typography sx={{ fontWeight: 'bold', color: '#2c5282' }}>
            {title}{' '}
            {sourcesInfo && (
              <span style={{ fontSize: '0.8em', color: '#718096' }}>
                {sourcesInfo}
              </span>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DataSection>
                <Label>Price Range:</Label>
                <Value>
                  {formatPrice(priceSection.min, isIndia)} -{' '}
                  {formatPrice(priceSection.max, isIndia)}
                </Value>
              </DataSection>
            </Grid>

            <Grid item xs={6}>
              <DataSection>
                <Label>Average Price:</Label>
                <Value>{formatPrice(priceSection.average, isIndia)}</Value>
              </DataSection>
            </Grid>

            <Grid item xs={6}>
              <DataSection>
                <Label>Median Price:</Label>
                <Value>{formatPrice(priceSection.median, isIndia)}</Value>
              </DataSection>
            </Grid>
          </Grid>

          <Typography
            variant="subtitle2"
            sx={{ mt: 2, mb: 1, color: '#4a5568', fontWeight: 'medium' }}
          >
            By Quality Level:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <DataSection>
                <Label>Low Quality</Label>
                <Value>
                  {formatPrice(priceSection.lowQualityPrice, isIndia)}
                </Value>
              </DataSection>
            </Grid>
            <Grid item xs={4}>
              <DataSection>
                <Label>Medium Quality</Label>
                <Value>
                  {formatPrice(priceSection.mediumQualityPrice, isIndia)}
                </Value>
              </DataSection>
            </Grid>
            <Grid item xs={4}>
              <DataSection>
                <Label>Good Quality</Label>
                <Value>
                  {formatPrice(priceSection.goodQualityPrice, isIndia)}
                </Value>
              </DataSection>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  // Render product item with its price sections
  const renderProductItem = (item, index) => {
    // Skip if no price data available
    if (!item.chinaWholesalePrice && !item.indiaWholesalePrice) {
      return null;
    }

    // Format date if available
    let dateInfo = '';
    if (item.extractionDate) {
      try {
        const date = new Date(item.extractionDate);
        dateInfo = date.toLocaleDateString();
      } catch (e) {
        console.error('Error formatting date:', e);
      }
    }

    return (
      <Box key={index} sx={{ mb: 3 }}>
        {item.productName && (
          <Typography variant="h6" sx={{ mb: 1 }}>
            {item.productName}
            {dateInfo && (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                ({dateInfo})
              </Typography>
            )}
          </Typography>
        )}

        {item.chinaWholesalePrice &&
          renderPriceSection(
            'China Wholesale',
            item.chinaWholesalePrice,
            index === 0,
          )}
        {item.indiaWholesalePrice &&
          renderPriceSection(
            'India Wholesale(₹) ',
            item.indiaWholesalePrice,
            true,
          )}
      </Box>
    );
  };

  // Add a try-catch around the entire render to prevent blank screen
  try {
    return (
      <Box>
        {dataItems.length > 0 ? (
          dataItems.map((item, index) => renderProductItem(item, index))
        ) : (
          <Typography>No pricing data available</Typography>
        )}
      </Box>
    );
  } catch (error) {
    console.error('Error rendering price display:', error);
    return showRawJson(data);
  }
};

function ApiCheckLink() {
  const [api1, setApi1] = useState('');
  const [api2, setApi2] = useState('');

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  const [result1, setResult1] = useState('');
  const [result2, setResult2] = useState('');

  const [parsedResult1, setParsedResult1] = useState(null);
  const [parsedResult2, setParsedResult2] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  // Separate checker for API 1
  const handleCheckAPI1 = async () => {
    setLoading1(true);
    setError1(null);
    setResult1('');
    setParsedResult1(null);

    try {
      const supplierName = encodeURIComponent(api1.trim());

      const response1 = await fetch(
        `${apiUrl}/api/trustSupplier?supplierName=${supplierName}`,
      );

      if (!response1.ok) {
        setResult1(`Error: ${response1.status}`);
      } else {
        try {
          const data = await response1.json();
          console.log('API 1 Response:', data); // Debug log

          // Store both raw and parsed data
          setResult1(JSON.stringify(data, null, 2));
          setParsedResult1(data);
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          const rawText = await response1.text();
          setResult1(rawText);
          setError1('Error parsing API response');
        }
      }
    } catch (err) {
      console.error('API request error:', err);
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
    setParsedResult2(null);

    const productName = encodeURIComponent(api2.trim());

    try {
      if (api2.trim()) {
        const response2 = await fetch(
          `${apiUrl}/api/productPrice?productName=${productName}`,
        );

        if (!response2.ok) {
          setResult2(`Error: ${response2.status}`);
        } else {
          try {
            const data = await response2.json();
            console.log('API 2 Response:', data); // Debug log

            // Store both raw and parsed data
            setResult2(JSON.stringify(data, null, 2));
            setParsedResult2(data);
          } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            const rawText = await response2.text();
            setResult2(rawText);
            setError2('Error parsing API response');
          }
        }
      }
    } catch (err) {
      console.error('API request error:', err);
      setError2('Something went wrong checking API 2');
    } finally {
      setLoading2(false);
    }
  };

  // Determine whether to show raw JSON or formatted display for API 1
  const renderApi1Result = () => {
    if (!result1) {
      return (
        <Typography color="textSecondary">
          Result will appear here...
        </Typography>
      );
    }

    if (result1.startsWith('Error:')) {
      return <Typography color="error">{result1}</Typography>;
    }

    // Use TrustScoreDisplay if we have parsed data
    try {
      if (parsedResult1) {
        return <TrustScoreDisplay data={parsedResult1} />;
      } else if (result1) {
        // Try to parse the result string
        return <TrustScoreDisplay data={result1} />;
      }
    } catch (error) {
      console.error('Error rendering trust score display:', error);
      // Fallback to showing raw JSON
      return (
        <Box
          component="pre"
          sx={{
            margin: 0,
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {result1}
        </Box>
      );
    }

    return <Typography>{result1}</Typography>;
  };

  // Determine whether to show raw JSON or formatted display for API 2
  const renderApi2Result = () => {
    if (!result2) {
      return (
        <Typography color="textSecondary">
          Result will appear here...
        </Typography>
      );
    }

    if (result2.startsWith('Error:')) {
      return <Typography color="error">{result2}</Typography>;
    }

    // Always show something - use PriceDataDisplay as primary, with fallback
    try {
      if (parsedResult2) {
        return <PriceDataDisplay data={parsedResult2} />;
      } else if (result2) {
        // Try to parse the result string if parsedResult2 is not set
        return <PriceDataDisplay data={result2} />;
      }
    } catch (error) {
      console.error('Error rendering formatted display:', error);
      // Fallback to showing raw JSON
      return (
        <Box
          component="pre"
          sx={{
            margin: 0,
            fontSize: '14px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {result2}
        </Box>
      );
    }

    return <Typography>{result2}</Typography>;
  };

  return (
    <Box sx={{ p: 2, width: '600px' }}>
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

      <ResultContainer>{renderApi1Result()}</ResultContainer>

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

      <ResultContainer>{renderApi2Result()}</ResultContainer>

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
