import { useState } from 'react';
import { Box } from '@mui/system';
import GradientButton from './GradientButton';
// import StyledTextField from './StyledTextField';
import { Typography } from '@mui/material';
import SupplierForm from './SupplierForm';

const Intro = ({ onSetStage }) => (
  <Box>
    <Box>
      <Typography
        sx={{
          fontSize: { xs: '26px', md: '48px' },
          fontWeight: 700,
          lineHeight: { xs: '28px', md: '58px' },
          fontFamily: 'Exo 2',
          color: '#0C2617',
          paddingBottom: '40px',
          textTransform: 'uppercase',
          padding: { xs: '20px  10px 0 10px', md: 'unset' },
        }}
      >
        Instant Confidence in Your Suppliers
      </Typography>
      <Typography
        sx={{
          paddingBottom: '50px',
          fontFamily: 'Jost',
          fontSize: { xs: '16px', md: '18px' },
          lineHeight: { xs: '23px', md: '29px' },
          fontWeight: 400,
          color: '#5A6D62',
          maxWidth: '600px',
          textAlign: 'center',
          margin: '0 auto',
          padding: { xs: '30px 10px 30px 10px', md: 'unset' },
        }}
      >
        Get a personalized, analyst-reviewed supplier vetting report for your
        <b> Chinese suppliers</b> within 24 hours—clearly identifying risks,
        verification status, and reliability, so you can import confidently
      </Typography>
    </Box>

    <Box
      sx={{
        display: 'flex',
        gap: '50px',
        justifyContent: 'center',
      }}
    >
      {/* <StyledTextField
          // onChange={(e) => setSubscriptionEmail(e.target.value)}
          // value={subscriptionEmail}
          sx={{
            padding: '11px 20px 0px 20px',
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
          label="Enter Supplier's name"
          fullWidth
        /> */}
      <GradientButton
        responsiveStyles={{
          padding: { xs: '8px 24px 8px 24px', md: '12px 40px 16px 40px' },
          marginTop: 0,
        }}
        onClick={() => onSetStage(1)}
      >
        REQUEST FREE REPORT
      </GradientButton>
    </Box>
  </Box>
);

const Conclusion = () => (
  <Box>
    <Typography
      sx={{
        fontSize: { xs: '26px', md: '48px' },
        fontWeight: 700,
        lineHeight: { xs: '28px', md: '58px' },
        fontFamily: 'Exo 2',
        color: '#0C2617',
        paddingBottom: '40px',
        textTransform: 'uppercase',
      }}
    >
      Thank You! Your request has been received.
    </Typography>
    <Typography
      sx={{
        paddingBottom: '50px',
        fontFamily: 'Jost',
        fontSize: '18px',
        lineHeight: '29px',
        fontWeight: 400,
        color: '#5A6D62',
        maxWidth: '600px',
        textAlign: 'center',
        margin: '0 auto',
      }}
    >
      You’ll clearly receive your personalized supplier vetting report in your
      inbox within the next 24 hours.
    </Typography>
  </Box>
);

const SupplierVetting = () => {
  const [stage, setStage] = useState(0);

  return (
    <Box
      sx={{
        maxWidth: '900px',
        textAlign: 'center',
      }}
    >
      {stage === 0 && <Intro onSetStage={setStage} />}
      {stage === 1 && <SupplierForm onSetStage={setStage} />}
      {stage === 2 && <Conclusion />}
    </Box>
  );
};

export default SupplierVetting;
