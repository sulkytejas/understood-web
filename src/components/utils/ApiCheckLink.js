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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { styled } from '@mui/system';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Link as LinkIcon,
  Receipt as ReceiptIcon,
  RestartAlt as RestartIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Flag as FlagIcon,
  Description as DescriptionIcon,
  LocationOn as LocationOnIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from '@mui/icons-material';
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

// New styled components for HS Code lookup
// const ConversationBox = styled(Box)(({ theme }) => ({
//   border: '1px solid #ddd',
//   borderRadius: 4,
//   padding: theme.spacing(2),
//   marginBottom: theme.spacing(2),
//   backgroundColor: '#f9f9f9',
//   minHeight: '50px',
// }));

const HSCodeResultCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#e8f5e9',
  marginTop: theme.spacing(2),
  borderLeft: '4px solid #4caf50',
}));

const HSCodeDetailItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
}));

// Format price with 2 decimal places and currency symbol
const formatPrice = (price, isIndia = false) => {
  if (price === undefined || price === null) return 'N/A';

  // Handle small and large numbers differently
  if (price < 1000) {
    return `${isIndia ? '₹' : '$'}${Number(price).toFixed(2)}`;
  } else {
    // Format larger numbers with commas
    return `${isIndia ? '₹' : '$'}${Number(price).toLocaleString('en-US', {
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

// Component to display HS Code lookup results
const HSCodeDisplay = ({ data }) => {
  if (!data) return <Typography>No data available</Typography>;

  // Handle different response types
  const renderResponse = () => {
    switch (data.type) {
      case 'tariff_details': {
        const details = data.data;
        return (
          <HSCodeResultCard>
            <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32' }}>
              HS Code Details
            </Typography>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                HS Code:
              </Typography>
              <Typography>{details.hs_code}</Typography>
            </HSCodeDetailItem>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                Category:
              </Typography>
              <Typography>{details.main_description}</Typography>
            </HSCodeDetailItem>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                Description:
              </Typography>
              <Typography>{details.sub_description}</Typography>
            </HSCodeDetailItem>

            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#1976d2' }}>
              Tariff Details
            </Typography>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                Basic Duty:
              </Typography>
              <Typography>{details.basic_duty}</Typography>
            </HSCodeDetailItem>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                IGST:
              </Typography>
              <Typography>{details.igst}</Typography>
            </HSCodeDetailItem>

            <HSCodeDetailItem>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ minWidth: '120px' }}
              >
                Social Welfare:
              </Typography>
              <Typography>{details.social_welfare_surcharge}</Typography>
            </HSCodeDetailItem>

            {details.url && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  <a
                    href={details.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    More Information →
                  </a>
                </Typography>
              </Box>
            )}
          </HSCodeResultCard>
        );
      }

      case 'options':
      case 'stage2_options':
      case 'stage3_options': {
        return (
          <Box>
            <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
              Please select an option:
            </Typography>
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                backgroundColor: '#f5f5f5',
                padding: 2,
                borderRadius: 1,
              }}
            >
              {data.response}
            </Typography>
          </Box>
        );
      }

      case 'error': {
        return (
          <Box sx={{ color: 'error.main', p: 2 }}>
            <Typography>Error: {data.response}</Typography>
          </Box>
        );
      }

      default: {
        return (
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
            }}
          >
            {data.response}
          </Typography>
        );
      }
    }
  };

  return renderResponse();
};

// Component to display supplier search results
const SupplierDisplay = ({ data }) => {
  if (!data) return <Typography>No data available</Typography>;

  try {
    // Parse data if it's a string
    const supplierData = typeof data === 'string' ? JSON.parse(data) : data;

    // Extract the necessary information
    const { product, platform, suppliers_count, suppliers, status } =
      supplierData;

    // If there's an error or no suppliers found
    if (status !== 'success' || !suppliers || suppliers_count === 0) {
      return (
        <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 1 }}>
          <Typography variant="h6" color="warning.dark">
            {status !== 'success' ? 'Error' : 'No Suppliers Found'}
          </Typography>
          <Typography>
            {status !== 'success'
              ? supplierData.message || 'Failed to find suppliers'
              : `No suppliers found for "${product}" on ${platform}`}
          </Typography>
        </Box>
      );
    }

    // Determine badge color based on platform
    const getPlatformColor = (platform) => {
      switch (platform) {
        case 'Alibaba':
          return '#ff6a00';
        case 'ChemNet':
          return '#3f51b5';
        case 'Made in China':
          return '#f44336';
        case 'YiwuGo':
          return '#4caf50';
        default:
          return '#9c27b0';
      }
    };

    // Render supplier cards
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Suppliers for {product}
          </Typography>
          <Chip
            label={platform}
            color="primary"
            sx={{
              bgcolor: getPlatformColor(platform),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        <Typography sx={{ mb: 2 }}>
          Found {suppliers_count} suppliers on {platform}
        </Typography>

        {suppliers.map((supplier, index) => (
          <Card
            key={index}
            sx={{
              mb: 2,
              borderLeft: `4px solid ${getPlatformColor(platform)}`,
            }}
          >
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: getPlatformColor(platform) }}>
                  <BusinessIcon />
                </Avatar>
              }
              title={supplier.company_name}
              subheader={supplier.country || supplier.location || ''}
            />
            <Divider />
            <CardContent>
              <List dense>
                {supplier.url && (
                  <ListItem>
                    <ListItemIcon>
                      <LanguageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Website"
                      secondary={
                        <a
                          href={supplier.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {supplier.url}
                        </a>
                      }
                    />
                  </ListItem>
                )}

                {supplier.contact_info && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Contact"
                      secondary={supplier.contact_info}
                    />
                  </ListItem>
                )}

                {supplier.country && (
                  <ListItem>
                    <ListItemIcon>
                      <FlagIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Country"
                      secondary={supplier.country}
                    />
                  </ListItem>
                )}

                {supplier.rating && (
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Rating"
                      secondary={supplier.rating}
                    />
                  </ListItem>
                )}

                {supplier.authentication && (
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Authentication"
                      secondary={supplier.authentication}
                    />
                  </ListItem>
                )}

                {supplier.main_products && (
                  <ListItem>
                    <ListItemIcon>
                      <StoreIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Main Products"
                      secondary={supplier.main_products}
                    />
                  </ListItem>
                )}

                {supplier.location && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={supplier.location}
                    />
                  </ListItem>
                )}
              </List>

              {supplier.products && supplier.products.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
                    Sample Products
                  </Typography>
                  {supplier.products.map((product, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{product.name}</strong>
                        {product.price && ` - Price: ${product.price}`}
                        {product.moq && ` - MOQ: ${product.moq}`}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  } catch (error) {
    console.error('Error rendering supplier display:', error);
    return showRawJson(data);
  }
};

// Component to display trade documentation requirements
const TradeDocDisplay = ({ data }) => {
  if (!data) return <Typography>No data available</Typography>;

  try {
    // Parse data if it's a string
    const tradeDocData = typeof data === 'string' ? JSON.parse(data) : data;

    // Extract the document arrays from different categories
    const allDocs = [
      ...(tradeDocData.required_documents?.standard || []),
      ...(tradeDocData.required_documents?.origin_port_specific || []),
      ...(tradeDocData.required_documents?.destination_port_specific || []),
      ...(tradeDocData.required_documents?.product_specific || []),
    ];

    // Get origin and destination info
    const origin = tradeDocData.origin || {};
    const destination = tradeDocData.destination || {};
    const product = tradeDocData.product || {};

    // If no documents found
    if (allDocs.length === 0) {
      return (
        <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 1 }}>
          <Typography variant="h6" color="warning.dark">
            No Documentation Requirements Found
          </Typography>
          <Typography>
            Could not find documentation requirements for the specified route
            and product.
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Required Documentation
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Trade Route:
          </Typography>
          <Typography>
            {origin.port_name || origin.port || 'Unknown'} →{' '}
            {destination.port_name || destination.port || 'Unknown'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Product Category:
          </Typography>
          <Typography>{product.category_name || 'Unknown'}</Typography>
        </Box>

        {/* Document categories */}
        {tradeDocData.required_documents?.standard?.length > 0 && (
          <DocumentSection
            title="Standard Documents"
            docs={tradeDocData.required_documents.standard}
            docDetails={tradeDocData.document_details}
          />
        )}

        {tradeDocData.required_documents?.origin_port_specific?.length > 0 && (
          <DocumentSection
            title={`${origin.port_name || 'Origin'} Specific Documents`}
            docs={tradeDocData.required_documents.origin_port_specific}
            docDetails={tradeDocData.document_details}
          />
        )}

        {tradeDocData.required_documents?.destination_port_specific?.length >
          0 && (
          <DocumentSection
            title={`${destination.port_name || 'Destination'} Specific Documents`}
            docs={tradeDocData.required_documents.destination_port_specific}
            docDetails={tradeDocData.document_details}
          />
        )}

        {tradeDocData.required_documents?.product_specific?.length > 0 && (
          <DocumentSection
            title="Product Specific Documents"
            docs={tradeDocData.required_documents.product_specific}
            docDetails={tradeDocData.document_details}
          />
        )}
      </Box>
    );
  } catch (error) {
    console.error('Error rendering trade documentation display:', error);
    return showRawJson(data);
  }
};

// Helper component for document sections
const DocumentSection = ({ title, docs, docDetails }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
      {title}
    </Typography>

    {docs.map((docId, index) => {
      const docDetail = docDetails[docId] || {};

      return (
        <Card key={index} sx={{ mb: 2, borderLeft: '4px solid #1976d2' }}>
          <CardContent>
            <Typography variant="h6" color="primary">
              {docDetail.name || docId}
            </Typography>

            {docDetail.description && (
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                {docDetail.description}
              </Typography>
            )}

            {docDetail.requirements && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Requirements:
                </Typography>
                <List dense>
                  {docDetail.requirements.map((req, reqIndex) => (
                    <ListItem key={reqIndex}>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={req} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {docDetail.issuing_authority && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Issuing Authority:</strong>{' '}
                {docDetail.issuing_authority}
              </Typography>
            )}

            {docDetail.notes && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                <strong>Note:</strong> {docDetail.notes}
              </Typography>
            )}
          </CardContent>
        </Card>
      );
    })}
  </Box>
);

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

  // HS code lookup state variables
  const [hsCodeInput, setHSCodeInput] = useState('');
  const [hsCodeLoading, setHSCodeLoading] = useState(false);
  const [hsCodeError, setHSCodeError] = useState(null);
  const [hsCodeResult, setHSCodeResult] = useState(null);
  const [hsCodeHistory, setHSCodeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [userId] = useState(() => `user-${Date.now()}`); // Generate unique user ID

  // Supplier search state variables
  const [supplierSearchInput, setSupplierSearchInput] = useState('');
  const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
  const [supplierSearchError, setSupplierSearchError] = useState(null);
  const [supplierSearchResult, setSupplierSearchResult] = useState('');
  const [parsedSupplierResult, setParsedSupplierResult] = useState(null);

  // Trade documentation lookup state variables
  const [tradeDocOriginPort, setTradeDocOriginPort] = useState('');
  const [tradeDocDestPort, setTradeDocDestPort] = useState('');
  const [tradeDocProductCategory, setTradeDocProductCategory] = useState('');
  const [tradeDocLoading, setTradeDocLoading] = useState(false);
  const [tradeDocError, setTradeDocError] = useState(null);
  const [tradeDocResult, setTradeDocResult] = useState('');
  const [parsedTradeDocResult, setParsedTradeDocResult] = useState(null);

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
        `${apiUrl}/api/verifySupplier?supplier=${supplierName}`,
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

  // Handler for supplier search
  const handleSupplierSearch = async () => {
    if (!supplierSearchInput.trim()) {
      setSupplierSearchError('Please enter a product name');
      return;
    }

    setSupplierSearchLoading(true);
    setSupplierSearchError(null);
    setSupplierSearchResult('');
    setParsedSupplierResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/supplier/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          productName: supplierSearchInput.trim(),
        }),
      });

      if (!response.ok) {
        setSupplierSearchError(`Error: ${response.status}`);
      } else {
        try {
          const data = await response.json();
          console.log('Supplier Search Response:', data); // Debug log

          // Store both raw and parsed data
          setSupplierSearchResult(JSON.stringify(data, null, 2));
          setParsedSupplierResult(data);
        } catch (parseError) {
          console.error('Error parsing supplier search response:', parseError);
          const rawText = await response.text();
          setSupplierSearchResult(rawText);
          setSupplierSearchError('Error parsing supplier search response');
        }
      }
    } catch (err) {
      console.error('Supplier search error:', err);
      setSupplierSearchError('Something went wrong with supplier search');
    } finally {
      setSupplierSearchLoading(false);
    }
  };

  // Handler for trade documentation lookup
  const handleTradeDocLookup = async () => {
    if (!tradeDocOriginPort.trim()) {
      setTradeDocError('Please enter an origin port');
      return;
    }

    if (!tradeDocDestPort.trim()) {
      setTradeDocError('Please enter a destination port');
      return;
    }

    if (!tradeDocProductCategory.trim()) {
      setTradeDocError('Please enter a product category');
      return;
    }

    setTradeDocLoading(true);
    setTradeDocError(null);
    setTradeDocResult('');
    setParsedTradeDocResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/trade-doc/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          originPort: tradeDocOriginPort.trim(),
          destinationPort: tradeDocDestPort.trim(),
          productCategory: tradeDocProductCategory.trim(),
        }),
      });

      if (!response.ok) {
        setTradeDocError(`Error: ${response.status}`);
      } else {
        try {
          const data = await response.json();
          console.log('Trade Doc Lookup Response:', data); // Debug log

          // Store both raw and parsed data
          setTradeDocResult(JSON.stringify(data, null, 2));
          setParsedTradeDocResult(data);
        } catch (parseError) {
          console.error('Error parsing trade doc lookup response:', parseError);
          const rawText = await response.text();
          setTradeDocResult(rawText);
          setTradeDocError('Error parsing trade doc lookup response');
        }
      }
    } catch (err) {
      console.error('Trade doc lookup error:', err);
      setTradeDocError('Something went wrong with trade doc lookup');
    } finally {
      setTradeDocLoading(false);
    }
  };

  // Function to handle HS code lookup
  const handleHSCodeLookup = async () => {
    if (!hsCodeInput.trim()) {
      setHSCodeError('Please enter a product description');
      return;
    }

    setHSCodeLoading(true);
    setHSCodeError(null);

    try {
      const response = await fetch(`${apiUrl}/api/hscode/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          userInput: hsCodeInput.trim(),
        }),
      });

      if (!response.ok) {
        setHSCodeError(`Error: ${response.status}`);
      } else {
        const data = await response.json();
        console.log('HS Code Response:', data);
        setHSCodeResult(data);

        // Update conversation history
        const newEntry = {
          role: 'user',
          content: hsCodeInput,
          timestamp: new Date().toISOString(),
        };
        setHSCodeHistory((prev) => [...prev, newEntry]);

        // Clear input if we got a response
        if (data.type !== 'error') {
          setHSCodeInput('');
        }
      }
    } catch (err) {
      console.error('HS Code lookup error:', err);
      setHSCodeError('Something went wrong with HS code lookup');
    } finally {
      setHSCodeLoading(false);
    }
  };

  // Function to reset HS code session
  const handleHSCodeReset = async () => {
    setHSCodeLoading(true);
    setHSCodeError(null);

    try {
      const response = await fetch(`${apiUrl}/api/hscode/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          action: 'reset',
        }),
      });

      if (!response.ok) {
        setHSCodeError(`Error: ${response.status}`);
      } else {
        const data = await response.json();
        setHSCodeResult(data);
        setHSCodeInput('');
        setHSCodeHistory([]);
      }
    } catch (err) {
      console.error('HS Code reset error:', err);
      setHSCodeError('Something went wrong resetting the session');
    } finally {
      setHSCodeLoading(false);
    }
  };

  // Function to get conversation history
  const handleGetHistory = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/hscode/history?userId=${userId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setHSCodeHistory(data.conversation_history || []);
        setShowHistory(true);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Render functions for API results
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

    // Use PriceDataDisplay for formatting
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

  // Function to render supplier search results
  const renderSupplierSearchResult = () => {
    if (!supplierSearchResult) {
      return (
        <Typography color="textSecondary">
          Supplier search results will appear here...
        </Typography>
      );
    }

    if (supplierSearchResult.startsWith('Error:')) {
      return <Typography color="error">{supplierSearchResult}</Typography>;
    }

    try {
      if (parsedSupplierResult) {
        return <SupplierDisplay data={parsedSupplierResult} />;
      } else if (supplierSearchResult) {
        return <SupplierDisplay data={supplierSearchResult} />;
      }
    } catch (error) {
      console.error('Error rendering supplier display:', error);
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
          {supplierSearchResult}
        </Box>
      );
    }

    return <Typography>{supplierSearchResult}</Typography>;
  };

  // Function to render trade documentation results
  const renderTradeDocResult = () => {
    if (!tradeDocResult) {
      return (
        <Typography color="textSecondary">
          Trade documentation requirements will appear here...
        </Typography>
      );
    }

    if (tradeDocResult.startsWith('Error:')) {
      return <Typography color="error">{tradeDocResult}</Typography>;
    }

    try {
      if (parsedTradeDocResult) {
        return <TradeDocDisplay data={parsedTradeDocResult} />;
      } else if (tradeDocResult) {
        return <TradeDocDisplay data={tradeDocResult} />;
      }
    } catch (error) {
      console.error('Error rendering trade doc display:', error);
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
          {tradeDocResult}
        </Box>
      );
    }

    return <Typography>{tradeDocResult}</Typography>;
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

      {/* Supplier Search Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Supplier Search
        </Typography>

        {/* Supplier Search input field */}
        <CustomTextField
          placeholder="Enter product name to find suppliers"
          value={supplierSearchInput}
          onChange={(e) => setSupplierSearchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !supplierSearchLoading) {
              handleSupplierSearch();
            }
          }}
          variant="outlined"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CustomIcon>
                  <SearchIcon />
                </CustomIcon>
              </InputAdornment>
            ),
          }}
        />
        {supplierSearchError && (
          <FormHelperText error>{supplierSearchError}</FormHelperText>
        )}

        {/* Button for supplier search */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 1, fontSize: '16px', color: '#fff' }}
          onClick={handleSupplierSearch}
          disabled={supplierSearchLoading}
        >
          {supplierSearchLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Find Suppliers'
          )}
        </Button>

        {/* Supplier Search Results Container */}
        <ResultContainer sx={{ maxHeight: '400px' }}>
          {renderSupplierSearchResult()}
        </ResultContainer>
      </Box>

      {/* Trade Documentation Lookup Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Trade Documentation Lookup
        </Typography>

        {/* Input fields */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <CustomTextField
              placeholder="Origin Port (e.g., Shanghai)"
              value={tradeDocOriginPort}
              onChange={(e) => setTradeDocOriginPort(e.target.value)}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CustomIcon>
                      <LocationOnIcon />
                    </CustomIcon>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <CustomTextField
              placeholder="Destination Port (e.g., Mumbai)"
              value={tradeDocDestPort}
              onChange={(e) => setTradeDocDestPort(e.target.value)}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CustomIcon>
                      <LocationOnIcon />
                    </CustomIcon>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <CustomTextField
          placeholder="Product Category (e.g., Electronics, Pharmaceuticals)"
          value={tradeDocProductCategory}
          onChange={(e) => setTradeDocProductCategory(e.target.value)}
          variant="outlined"
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CustomIcon>
                  <DescriptionIcon />
                </CustomIcon>
              </InputAdornment>
            ),
          }}
        />
        {tradeDocError && (
          <FormHelperText error>{tradeDocError}</FormHelperText>
        )}

        {/* Button for trade doc lookup */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 1, fontSize: '16px', color: '#fff' }}
          onClick={handleTradeDocLookup}
          disabled={tradeDocLoading}
        >
          {tradeDocLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Find Required Documentation'
          )}
        </Button>

        {/* Trade Doc Lookup Results Container */}
        <ResultContainer sx={{ maxHeight: '400px' }}>
          {renderTradeDocResult()}
        </ResultContainer>
      </Box>

      {/* HS Code Lookup Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          HS Code Lookup
        </Typography>

        {/* HS Code input field */}
        <CustomTextField
          placeholder="Describe your product (e.g., fresh salmon, laptop computer)"
          value={hsCodeInput}
          onChange={(e) => setHSCodeInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !hsCodeLoading) {
              handleHSCodeLookup();
            }
          }}
          variant="outlined"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CustomIcon>
                  <ReceiptIcon />
                </CustomIcon>
              </InputAdornment>
            ),
          }}
        />
        {hsCodeError && <FormHelperText error>{hsCodeError}</FormHelperText>}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ fontSize: '16px', color: '#fff' }}
            onClick={handleHSCodeLookup}
            disabled={hsCodeLoading}
          >
            {hsCodeLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Submit'
            )}
          </Button>

          <IconButton
            color="secondary"
            onClick={handleHSCodeReset}
            disabled={hsCodeLoading}
            title="Start New Search"
          >
            <RestartIcon />
          </IconButton>

          <IconButton
            color="primary"
            onClick={handleGetHistory}
            disabled={hsCodeLoading}
            title="View Conversation History"
          >
            <HistoryIcon />
          </IconButton>
        </Box>

        {/* Result container */}
        <ResultContainer>
          {hsCodeResult ? (
            <HSCodeDisplay
              data={hsCodeResult}
              conversationHistory={hsCodeHistory}
            />
          ) : (
            <Typography color="textSecondary">
              Enter a product to find its HS code...
            </Typography>
          )}
        </ResultContainer>

        {/* Conversation history dialog */}
        <Dialog
          open={showHistory}
          onClose={() => setShowHistory(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Conversation History</DialogTitle>
          <DialogContent>
            {hsCodeHistory.length > 0 ? (
              hsCodeHistory.map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    backgroundColor:
                      entry.role === 'user' ? '#e3f2fd' : '#f3e5f5',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {entry.role === 'user' ? 'You' : 'System'}:
                  </Typography>
                  <Typography>{entry.content}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(entry.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography>No conversation history yet</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHistory(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default ApiCheckLink;
