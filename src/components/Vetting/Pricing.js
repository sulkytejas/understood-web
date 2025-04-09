import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  // Button,
  styled,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Header from './header';
import Footer from './footer';

const PricingComponent = () => {
  const plans = [
    {
      title: 'Basic',
      subtitle: 'China Corporation Verification Report',
      price: '49',
      features: [
        'Company Profile',
        'Registration Information',
        'Advanced Registration Information',
        'Legal Representative Information',
        'Company Annual Report',
      ],
    },
    {
      title: 'In-Depth',
      subtitle: 'China Corporation Verification Report',
      price: '99',
      features: [
        'Include Light Plan',
        'Company Business Information',
        'Company Litigation Records & Legal Checks',
        'Company Risks',
        'Company Certificates',
      ],
    },
  ];

  const Container = styled('div')({
    maxWidth: '1400px !important',
  });

  return (
    <Container>
      <Header />

      <Box sx={{ width: '100%', py: 4 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
          fontFamily="Exo 2"
        >
          Choose Your Plan
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid item xs={12} sm={10} md={6} lg={5} key={index}>
              <Paper
                elevation={3}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 2,
                  margin: '10px',
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#0C2617',
                    color: 'white',
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {plan.title}
                  </Typography>
                  {/* <Typography variant="subtitle1">{plan.subtitle}</Typography> */}
                </Box>

                <Box
                  sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    fontFamily: 'Jost !important',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'baseline',
                      }}
                    >
                      <Typography
                        component="span"
                        variant="h6"
                        color="text.secondary"
                      >
                        $
                      </Typography>
                      <Typography
                        component="span"
                        variant="h2"
                        sx={{ fontWeight: 'medium', color: '#444' }}
                      >
                        {plan.price}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">
                      USD
                    </Typography>
                  </Box>

                  <List sx={{ mb: 'auto' }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem
                        key={idx}
                        sx={{
                          py: 1,
                          px: 0,
                          borderTop: idx > 0 ? '1px solid #eee' : 'none',
                          fontFamily: 'Jost !important',
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CheckCircleOutlineIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    {/* <Button
                      variant="contained"
                      size="large"
                      color="success"
                      sx={{
                        px: 4,
                        borderRadius: 1,
                        fontWeight: 'medium',
                        textTransform: 'uppercase',
                      }}
                    >
                      Get Start
                    </Button> */}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Typography
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 'bold' }}
          fontFamily="Jost"
          fontSize=" 18px"
          marginTop="40px"
        >
          {`We're currently processing payments manually while we complete our
          payment infrastructure.`}
        </Typography>
      </Box>

      <Footer />
    </Container>
  );
};

export default PricingComponent;
