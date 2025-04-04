import React from 'react';
import { Stack, Button, Drawer, Box, styled, Typography } from '@mui/material';

import SolidButton from './SolidButton';
import StyledTextField from './StyledTextField';

const Heading = styled(Typography)(({ theme }) => ({
  fontFamily: "'Exo 2', 'sans-serif'",
  fontWeight: '700',
  fontSize: '28px',
  lineHeight: '39.2px',

  [theme.breakpoints.down('md')]: {
    fontSize: '20px',
    lineHeight: '28px',
  },
}));

const BodyText = styled(Typography)(({ theme }) => ({
  fontFamily: "'Jost', 'sans-serif'",
  fontWeight: 400,
  fontSize: '18px',
  lineHeight: '25.4px',
  paddingBottom: '20px',
  paddingTop: '10px',

  [theme.breakpoints.down('md')]: {
    fontSize: '16px',
    lineHeight: '22.4px',
    paddingTop: '5px',
  },
}));

const MobileMenu = ({
  isDrawerOpen,
  setIsDrawerOpen,
  FeatureListRef,
  HowItWorksRef,
  ReleasePlanRef,
  scrollToSection,
  setIsOpenSignUpModal,
}) => {
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Drawer
      anchor="bottom" // Specifies the side of the screen from which the drawer will slide in
      open={isDrawerOpen}
      onClose={handleDrawerClose}
      BackdropProps={{ style: { backgroundColor: 'transparent' } }}
      PaperProps={{
        sx: {
          height: '90vh', // Full viewport height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px',
          borderRadius: '30px 30px 0 0',
        },
      }}
    >
      <Box
        sx={{
          width: '100%', // Width of the drawer
          bgcolor: 'background.paper',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}
        role="presentation"
        onClick={handleDrawerClose} // Closes the drawer when a button is clicked
      >
        {/* <IconButton
          sx={{ alignSelf: "flex-end" }}
          onClick={handleDrawerClose}
          aria-label="close menu"
        >
          <CloseIcon />
        </IconButton> */}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Button
            onClick={() => scrollToSection(FeatureListRef)}
            sx={{
              color: '#5A6D62',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: "'Exo 2', 'sans-serif'",
              textTransform: 'none',
            }}
          >
            Features
          </Button>
          <Button
            onClick={() => scrollToSection(HowItWorksRef)}
            sx={{
              color: '#5A6D62',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: "'Exo 2', 'sans-serif'",
              textTransform: 'none',
            }}
          >
            How It Works
          </Button>
          <Button
            onClick={() => scrollToSection(ReleasePlanRef)}
            sx={{
              color: '#5A6D62',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: "'Exo 2', 'sans-serif'",
              textTransform: 'none',
            }}
          >
            Release Plan
          </Button>
          <Button
            sx={{
              color: '#5A6D62',
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: "'Exo 2', 'sans-serif'",
              textTransform: 'none',
            }}
            onClick={() => setIsOpenSignUpModal(true)}
          >
            Sign Up
          </Button>
          <Box sx={{ paddingTop: '130px' }}>
            <Heading gutterBottom>Subscription</Heading>
            <BodyText gutterBottom>
              Subscribe to receive notifications about updates
            </BodyText>
            <Box
              component="form"
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                flexDirection: 'column',
              }}
            >
              <StyledTextField variant="filled" label="Your email" fullWidth />
              <SolidButton sx={{ paddingBottom: '16px' }}>
                Subscribe
              </SolidButton>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default MobileMenu;
