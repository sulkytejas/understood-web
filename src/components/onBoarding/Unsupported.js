import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning'; // Warning icon from Material UI icons

const UnsupportedBrowser = ({ variant }) => {
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }} // Full-height to center vertically
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
        border={1}
        borderColor="grey.300"
        borderRadius={8}
        bgcolor="#fafafa"
        boxShadow={3}
        style={{ maxWidth: '400px', textAlign: 'center' }}
      >
        {/* Warning Icon */}
        <WarningIcon style={{ fontSize: 80, color: '#fbc02d' }} />
        {variant === 'device' && (
          <div>
            <Typography
              variant="h5"
              component="div"
              color="textPrimary"
              gutterBottom
            >
              Desktop Size Not Supported!
            </Typography>

            {/* Message */}
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Sorry, but we currently do not support desktop screen sizes. We
              are actively working towards adding support for desktop
              resolutions.
            </Typography>
          </div>
        )}

        {variant === 'browser' && (
          <div>
            <Typography
              variant="h5"
              component="div"
              color="textPrimary"
              gutterBottom
            >
              Browser Not Supported!
            </Typography>

            {/* Message */}
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Sorry, but your current browser is not supported.
            </Typography>

            {/* Highlight Google Chrome with Chrome logo colors */}
            <Typography variant="body2" color="textSecondary" gutterBottom>
              We currently only support{' '}
              <span style={{ color: '#DB4437' }}>G</span>
              <span style={{ color: '#4285F4' }}>o</span>
              <span style={{ color: '#F4B400' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span>
              <span style={{ color: '#0F9D58' }}>l</span>
              <span style={{ color: '#DB4437' }}>e</span>{' '}
              <span style={{ color: '#4285F4' }}>C</span>
              <span style={{ color: '#F4B400' }}>h</span>
              <span style={{ color: '#0F9D58' }}>r</span>
              <span style={{ color: '#DB4437' }}>o</span>
              <span style={{ color: '#4285F4' }}>m</span>
              <span style={{ color: '#F4B400' }}>e</span>.
            </Typography>

            {/* Additional Info */}
            <Typography variant="body2" color="textSecondary">
              Please switch to Chrome to continue using this site.
            </Typography>
          </div>
        )}
        {/* Header */}
      </Box>
    </Grid>
  );
};

export default UnsupportedBrowser;
