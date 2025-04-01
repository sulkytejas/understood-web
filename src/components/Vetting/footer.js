import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  styled,
  css,
  Link,
} from '@mui/material';

import Grid from '@mui/material/Grid';

import StyledTextField from './StyledTextField';
import SolidButton from './SolidButton';
import { ReactComponent as Logo } from '../assets/understood_logo.svg';

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

// eslint-disable-next-line react/no-unknown-property
const linkStyle = css`
  font-family: 'Jost';
  font-weight: 400;

  color: #5a6d62;
  text-transform: none;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = ({ scrollRef, isBlog = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isMessageSent, setIsMessageSent] = useState(false);
  const [subscriptionEmail, setSubscriptionEmail] = useState('');

  const handleSubmit = async () => {
    const formData = {
      // name: event.target.name.value,
      // email: event.target.email.value,
      // message: event.target.message.value,
      name: 'Contact us Form',
      email,
      message,
    };

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbwJ6A6N6qhA8xkQkTq538Xnebo9PVK47yQeYlO1Lh0bOmYjlDfI89PtsLRdi0XGo4zJZw/exec',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
      );
      setEmail('');
      setMessage('');
      setIsMessageSent(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleSubscription = async () => {
    const formData = {
      email: subscriptionEmail,
    };

    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbyFBHY2GkqXbI0y7aoxwd_xKUK-4jlUeNzG7QYqidLPUyfmRiYMJZueB-u35EUwYLBS/exec',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
      );
      setSubscriptionEmail('');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: { xs: '30px 30px 0 0', md: '80px 80px 0 0' },
      }}
      ref={scrollRef}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          //   padding: { xs: '25px', md: '70px' },
          //   marginTop: { xs: '120px', md: '250px' },

          '& a': {
            color: '#5A6D62',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Link
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              '--Link-underlineColor': 'transparent',
              textDecoration: 'none',
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="logo"
              variant="text"
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
              Understood
            </Typography>
          </Link>
        </Stack>

        <Grid
          container
          spacing={4}
          sx={{
            justifyContent: {
              xs: 'start',
              md: 'space-between',
            },
            width: '100%',
            paddingTop: { xs: '50px', md: '50px' },
          }}
        >
          {/* Contact Form */}
          <Grid item xs={12} sm={6} md={4}>
            <Heading gutterBottom>Get In Touch With Us</Heading>
            <BodyText gutterBottom>
              You can ask any question you are interested in.
            </BodyText>
            <Box
              component="form"
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <StyledTextField
                onChange={(e) => setEmail(e.target.value)}
                variant="filled"
                label="Your email"
                fullWidth
                value={email}
              />
              <StyledTextField
                onChange={(e) => setMessage(e.target.value)}
                variant="filled"
                label="Your Message"
                fullWidth
                multiline
                rows={4}
                value={message}
              />
              {isMessageSent && (
                <BodyText>Thank you! We will get back to you shortly</BodyText>
              )}
              <SolidButton
                sx={{
                  alignSelf: { xs: 'center', md: 'flex-start' },
                  paddingBottom: '16px',
                }}
                onClick={() => handleSubmit()}
              >
                Send
              </SolidButton>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={5}
            sx={{ display: isMobile ? 'none' : 'unset' }}
          >
            <Heading gutterBottom>Subscription</Heading>
            <BodyText gutterBottom>
              Subscribe to receive notifications about updates
            </BodyText>
            <Box
              component="form"
              sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
            >
              <StyledTextField
                onChange={(e) => setSubscriptionEmail(e.target.value)}
                value={subscriptionEmail}
                sx={{
                  width: '100%', // Default width, will apply to small screens
                  '@media (min-width: 1000px)': {
                    width: '240px', // Width for screens below 1200px
                  },
                  '@media (max-width: 1200px)': {
                    width: '280px', // Width for screens below 1200px
                  },
                  '@media (min-width: 1300px) and (max-width: 1400px)': {
                    width: '360px', // Width for screens between 1300px and 1400px
                  },
                  '@media (min-width: 1400px)': {
                    width: '390px', // Width for screens above 1400px
                  },
                }}
                variant="filled"
                label="Your email"
                fullWidth
              />
              <SolidButton
                sx={{ paddingBottom: '16px' }}
                onClick={() => handleSubscription()}
              >
                Subscribe
              </SolidButton>
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            sx={{ paddingTop: { xs: '50px', md: '0' } }}
          >
            <Heading gutterBottom>Quick Links</Heading>
            <Box>
              <BodyText sx={{ paddingBottom: '5px', color: '#5A6D62' }}>
                {isBlog ? (
                  <Link
                    href="/"
                    sx={{
                      '--Link-underlineColor': 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    Home
                  </Link>
                ) : (
                  <Link
                    href="/blog"
                    sx={{
                      '--Link-underlineColor': 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    Blog
                  </Link>
                )}
              </BodyText>
              <BodyText sx={{ paddingBottom: '5px', color: '#5A6D62' }}>
                FAQ(coming soon)
              </BodyText>
              <BodyText sx={{ color: '#5A6D62' }}>
                contact@myunderstood.com
              </BodyText>
            </Box>

            {/* <Box sx={{ display: "flex", gap: 2, marginTop: 2 }}>
             
              <Box component="span">🔗</Box>
              <Box component="span">📷</Box>
              <Box component="span">📘</Box>
            </Box> */}
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: { xs: '20px', md: '40px' },
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '30px',
        }}
      >
        <Box
          sx={{
            fontFamily: "'Jost'",
            fontWeight: 400,
            fontSize: { xs: '14px', md: '20px' },
            lineHeight: '28.9px',
            color: '#5A6D62',
          }}
        >
          2025 © Understood Connect Inc.
        </Box>
        <Box
          sx={{
            fontFamily: "'Jost'",
            fontWeight: 400,
            fontSize: { xs: '14px', md: '20px' },
            lineHeight: '28.9px',
            color: '#5A6D62',
          }}
        >
          {/* eslint-disable-next-line react/no-unknown-property */}
          <a href="/terms-of-service" css={linkStyle}>
            Terms & Service
          </a>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
