import { useState } from 'react';
import { Box } from '@mui/system';
import GradientButton from './GradientButton';
// import StyledTextField from './StyledTextField';
import { Typography, useMediaQuery } from '@mui/material';
import SupplierForm from './SupplierForm';

const Intro = ({ onSetStage, isMediumScreen }) => (
  <Box>
    <Box>
      <Typography
        sx={{
          fontSize: isMediumScreen ? '48px' : '26px',
          fontWeight: 700,
          lineHeight: isMediumScreen ? '58px' : '28px',
          fontFamily: 'Exo 2',
          color: '#0C2617',
          paddingBottom: '40px',
          textTransform: 'uppercase',
          padding: !isMediumScreen ? '20px  10px 0 10px' : '40px 0 0 0 0',
        }}
      >
        Instant Confidence in Your Suppliers
      </Typography>
      <Typography
        sx={{
          paddingBottom: '50px',
          fontFamily: 'Jost',
          fontSize: isMediumScreen ? '18px' : '16px',
          lineHeight: isMediumScreen ? '29px' : '23px',
          fontWeight: 400,
          color: '#5A6D62',
          maxWidth: '600px',
          textAlign: 'center',
          margin: '0 auto',
          padding: !isMediumScreen ? '30px 10px 30px 10px' : '30px 0 50px 0 ',
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
          padding: !isMediumScreen
            ? '8px 24px 8px 24px'
            : '12px 40px 16px 40px',
          marginTop: 0,
        }}
        onClick={() => onSetStage(1)}
      >
        REQUEST FREE REPORT
      </GradientButton>
    </Box>
  </Box>
);

const Conclusion = ({ isMediumScreen }) => (
  <Box>
    <Typography
      sx={{
        fontSize: isMediumScreen ? '48px' : '26px',
        fontWeight: 700,
        lineHeight: isMediumScreen ? '58px' : '28px',
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
  const isMediumScreen = useMediaQuery('(min-width:900px)');
  const [stage, setStage] = useState(0);

  return (
    <Box
      sx={{
        maxWidth: '900px',
        textAlign: 'center',
      }}
    >
      {stage === 0 && (
        <Intro onSetStage={setStage} isMediumScreen={isMediumScreen} />
      )}
      {stage === 1 && (
        <SupplierForm onSetStage={setStage} isMediumScreen={isMediumScreen} />
      )}
      {stage === 2 && <Conclusion />}
    </Box>
  );
};

export default SupplierVetting;
