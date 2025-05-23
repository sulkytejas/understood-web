import React, { useEffect, useState } from 'react';
import { Box, Grid, Container } from '@mui/material';
import { Typography, LinearProgress } from '@mui/material';
import BetaForm from './BetaForm';
import SupplierScreen from '../assets/screen_supplier_signup.png';
import SummaryScreen from '../assets/screen_summary_signup.png';
import CombinedScreen from '../assets/combined_screen_mobile.png'; // Add your combined mobile image
import AppStoreIcon from '../assets/app_strore_icon.png';
import AppStoreIconMobile from '../assets/app_store_icon_mobile.png';
import { styled } from '@mui/material/styles';

const Intro = () => (
  <Container maxWidth="xl">
    <Box sx={{ justifyContent: 'start', maxWidth: '1160px', mx: 'auto' }}>
      <Box>
        <Typography
          sx={{
            fontSize: { xs: '28px', md: '64px' },
            fontWeight: 700,
            lineHeight: { xs: '140%', md: '140%' },
            fontFamily: 'Exo 2',
            color: '#0C2617',
            paddingBottom: '30px',
            textTransform: 'uppercase',
            padding: { xs: '20px 10px 30px 10px', md: '40px 0 0 0' },
          }}
        >
          Beta Sign Up
        </Typography>
        <Typography
          sx={{
            paddingBottom: '50px',
            fontFamily: 'Jost',
            fontSize: { xs: '14px', md: '20px' },
            lineHeight: '140%',
            fontWeight: 400,
            color: '#5A6D62',
            padding: { xs: '0 20px 20px 20px', md: '20px 80px 43px 80px' },
            textAlign: 'center',
            margin: '0 auto',
          }}
        >
          Were in beta and giving early access to buyers who want to simplify
          sourcing and stop bleeding margin. Were in beta and giving early
          access to buyers who want to simplify sourcing and stop bleeding
          margin. Were in beta and giving early access to buyers who want to
          simplify sourcing and stop bleeding margin.
        </Typography>
      </Box>
    </Box>
  </Container>
);

// Custom Progress Bar Component
function CustomProgressBar({
  value = 85,
  height = 8,
  borderRadius = 20,
  backgroundColor = '#e0e0e0',
  gradient = 'linear-gradient(90deg, #4ABBC9 0%, #ACEE5C 50%, #3DB141 100%)',
}) {
  const StyledProgress = styled(LinearProgress)(() => ({
    height: height,
    borderRadius: borderRadius,
    backgroundColor: backgroundColor,
    '& .MuiLinearProgress-bar': {
      borderRadius: borderRadius,
      background: gradient,
    },
  }));

  return <StyledProgress variant="determinate" value={value} />;
}

const BetaSignUp = () => {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('signUp_form_submitted') === 'true') {
      setIsFormSubmitted(true);
    }
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <Intro />

      {/* Combined Mobile Image - Only show on mobile */}
      <Container
        maxWidth="sm"
        sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}
      >
        <Box
          component="img"
          src={CombinedScreen}
          alt="Combined Screen"
          sx={{
            width: '100%',
            height: 'auto',
            maxWidth: '374px',
          }}
        />
      </Container>

      {/* Main Layout */}
      <Container maxWidth="xl">
        <Grid container spacing={0} alignItems="center" justifyContent="center">
          {/* Left column - Hide on mobile */}
          <Grid
            item
            xs={12}
            lg={3}
            sx={{ display: { xs: 'none', lg: 'block' } }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={SupplierScreen}
                alt="Supplier Screen"
                sx={{
                  width: { md: '200px', lg: '300px', xl: '450px' },
                  height: 'auto',
                  position: { lg: 'absolute' },
                  right: { lg: '-50px', xl: '0px' },
                  top: { lg: '50%' },
                  transform: { lg: 'translateY(-50%)' },
                }}
              />
            </Box>
          </Grid>

          {/* Middle column - Form */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                px: 2,
                marginTop: { xs: '-300px', md: 'unset' },
              }}
            >
              <BetaForm onSetIsFormSubmitted={setIsFormSubmitted} />
            </Box>
          </Grid>

          {/* Right column - Hide on mobile */}
          <Grid
            item
            xs={12}
            lg={3}
            sx={{ display: { xs: 'none', lg: 'block' } }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={SummaryScreen}
                alt="Summary Screen"
                sx={{
                  width: { md: '200px', lg: '300px', xl: '450px' },
                  height: 'auto',
                  position: { lg: 'absolute' },
                  left: { lg: '-50px', xl: '0px' },
                  top: { lg: '50%' },
                  transform: { lg: 'translateY(-50%)' },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Bottom Section with Progress Bar - Desktop */}
      <Container
        maxWidth="xl"
        sx={{ mt: { xs: 4, lg: 8 }, display: { xs: 'none', lg: 'block' } }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            px: { xs: 2, lg: 0 },
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 0 },
          }}
        >
          {/* Left: App Store Icons */}
          <Box
            sx={{
              flex: { md: '0 0 auto' },
              order: { xs: 1, md: 1 },
            }}
          >
            <Box
              component="img"
              src={AppStoreIcon}
              alt="App Store Icons"
              sx={{
                height: 'auto',
                width: { xs: '200px', md: '150px' },
              }}
            />
          </Box>

          {/* Center: Progress Bar (Mobile: full width, Desktop: flex) */}

          {/* Right: Slots Left */}
          <Box
            sx={{
              flex: { md: '0 0 auto' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              order: { xs: 2, md: 3 },
            }}
          >
            <Box
              sx={{
                color: '#0C2617',
                fontWeight: '700',
                fontFamily: 'Exo 2',
                lineHeight: '100%',
                fontSize: { xs: '40px', md: '65px' },
              }}
            >
              {isFormSubmitted ? '14' : '15'}/50
            </Box>
            <Box
              sx={{
                color: '#5A6D62',
                fontWeight: '400',
                fontFamily: 'Jost',
                lineHeight: '120%',
                fontSize: { xs: '14px', md: '20px' },
              }}
            >
              slots left
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            flex: { md: '1 1 auto' },
            mx: { md: 3 },
            width: { xs: '100%', md: 'auto' },
            order: { xs: 3, md: 2 },
            marginTop: '20px',
          }}
        >
          <CustomProgressBar value={isFormSubmitted ? 80 : 75} />
        </Box>
      </Container>

      {/* Bottom Section with Progress Bar - Desktop */}
      <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
        <Container maxWidth="xl" sx={{ mt: { xs: 4, lg: 8 } }}>
          <Box
            sx={{
              flex: { md: '0 0 auto' },
              order: { xs: 1, md: 1 },
              marginBottom: '40px',
            }}
          >
            <Box
              component="img"
              src={AppStoreIconMobile}
              alt="App Store Icons"
              sx={{
                height: 'auto',
                maxWidth: '345px',
              }}
            />
          </Box>
        </Container>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            flex: { md: '1 1 auto' },
            mx: { md: 3 },
            // width: '100%',
            order: { xs: 3, md: 2 },
            marginTop: '20px',
            background: '#fff',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', // Optional shadow for separation
            padding: '16px', // Add some padding so content doesn't touch edges
            maxWidth: '100vw',
            borderRadius: '30px 30px 0 0',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              // width: '100%',
              padding: '16px', // Optional padding
              background: '#fff', // Optional background
            }}
          >
            <Box
              sx={{
                color: '#0C2617',
                fontWeight: '700',
                fontFamily: 'Exo 2',
                lineHeight: '100%',
                fontSize: '20px',
              }}
            >
              {isFormSubmitted ? '14' : '15'}/50
            </Box>

            <Box
              sx={{
                color: '#5A6D62',
                fontWeight: '400',
                fontFamily: 'Jost',
                lineHeight: '120%',
                fontSize: '14px',
              }}
            >
              slots remaining
            </Box>
          </Box>
          <CustomProgressBar value={isFormSubmitted ? 80 : 75} />
        </Box>
      </Box>
    </Box>
  );
};

export default BetaSignUp;
