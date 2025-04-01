import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Stack,
  Box,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/system';

import { ReactComponent as Logo } from '../assets/understood_logo.svg';
import { ReactComponent as MenuIcon } from '../assets/jam_menu_icon.svg';
import SolidButton from './SolidButton';
import MobileMenu from './MobileMenu';
import { ReactComponent as MenuCloseIcon } from '../assets/jam_menu_close.svg';
import SignUpModal from './SignUpModal';

const StyledDesktopMenuButton = styled(Button)({
  fontFamily: "'Exo 2'",
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: '25.2px',
  textAlign: 'left',
  color: '#5A6D62',
  textTransform: 'none',
});

const Header = ({
  siteTitle = 'Understood',

  isLinksVisible = true,
  isBlog = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOpenSignUpModal, setIsOpenSignUpModal] = useState(false);

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          margin: { xs: '0', md: '0 80px' },
        }}
      >
        {/* Logo Section */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="logo"
            variant="text"
            href={isBlog ? '/blog' : '/'}
          >
            {/* Replace with your logo image */}

            <Logo
              alt="Understood Logo"
              style={{
                width: isMobile ? '30px' : 50,
                height: isMobile ? '30px' : 50,
              }}
            />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              fontWeight: '700',
              fontFamily: "'Exo 2', 'sans-serif'",
              color: '#4ABBC9',
              fontSize: { xs: '20px', md: '32px' },
              lineHeight: { xs: '28px', md: '44.8px' },
              textAlign: 'left',
            }}
          >
            {siteTitle}
          </Typography>
        </Stack>

        {/* Desktop Navigation Links */}
        {!isBlog &&
          (!isMobile && isLinksVisible ? (
            <Stack
              direction="row"
              spacing={4}
              sx={{
                flexGrow: 1,
                marginLeft: '120px',
              }}
            >
              <StyledDesktopMenuButton variant="text">
                Features
              </StyledDesktopMenuButton>
              <StyledDesktopMenuButton variant="text">
                How It Works
              </StyledDesktopMenuButton>
              <StyledDesktopMenuButton variant="text">
                Release plan
              </StyledDesktopMenuButton>
            </Stack>
          ) : (
            // Mobile Navigation Icon
            isLinksVisible && (
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={() => setIsDrawerOpen(true)}
                sx={{
                  transition: 'ease 0.8s',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    transition: 'all 0.8s ease',
                    opacity: isDrawerOpen ? 0 : 1,
                    transform: isDrawerOpen ? 'scale(0.8)' : 'scale(1)', // Scale down when fading out
                  }}
                >
                  <MenuIcon />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    transition: 'all 0.8s ease',
                    opacity: isDrawerOpen ? 1 : 0,
                    transform: isDrawerOpen ? 'scale(1)' : 'scale(0.8)', // Scale up when fading in
                  }}
                >
                  <MenuCloseIcon />
                </Box>
              </IconButton>
            )
          ))}

        {/* Right Section with Sign-Up Buttons */}
        {!isMobile && (
          <Stack direction="row" sx={{ gap: '10px' }}>
            {/* {isLinksVisible && (
              <Button
                sx={{
                  fontFamily: "'Exo 2', 'sans-serif'",
                  color: '#0C2617',
                  textTransform: 'none',

                  fontWeight: '700',
                  fontSize: '18px',
                  lineHeight: '21.6px',
                }}
              >
                Contact Us
              </Button>
            )} */}

            <SolidButton
              variant="contained"
              onClick={() => setIsOpenSignUpModal(true)}
            >
              Contact Us
            </SolidButton>
          </Stack>
        )}

        {/* Mobile Dropdown Menu */}
        {/* <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleMenuClose}>Features</MenuItem>
          <MenuItem onClick={handleMenuClose}>How It Works</MenuItem>
          <MenuItem onClick={handleMenuClose}>Release Plan</MenuItem>
          <MenuItem onClick={handleMenuClose}>Sign Up</MenuItem>
        </Menu> */}

        <MobileMenu
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          setIsOpenSignUpModal={setIsOpenSignUpModal}
        />
        <SignUpModal
          isOpenSignUpModal={isOpenSignUpModal}
          setIsOpenSignUpModal={setIsOpenSignUpModal}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
