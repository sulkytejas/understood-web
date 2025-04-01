// import { useState } from 'react';

import Header from './header';
import Footer from './footer';
// import SubNavigation from './SubNavigation';
import { styled } from '@mui/system';
import SupplierVetting from './SupplierVetting';
import { Box } from '@mui/material';

// const FEATURE_LIST = ['Supplier Vetting', 'Automated Dispute Resolution'];

const MicroFeatures = () => {
  // const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const Container = styled('div')({
    maxWidth: '1400px !important',
  });

  return (
    <Container>
      <Header />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // horizontally center if items aren't full width
          alignItems: 'center', // vertically center within container
          textAlign: 'center', // ensure text is centered
          minHeight: {
            xs: 'auto', // auto or a smaller fixed height on extra-small screens
            sm: 400, // 400px on small and up
            md: 600, // 600px on medium and up
          }, // ensures the container fills full screen for vertical centering
          maxWidth: '1400px',
          mx: 'auto', // center horizontally on the page if desired
          p: 2,
          padding: '80px 0',
        }}
      >
        <SupplierVetting />
        {/* {currentFeatureIndex === 0 && <SupplierVetting />} */}

        {/* <SubNavigation
          featureList={FEATURE_LIST}
          onSetCurrentFeatureIndex={setCurrentFeatureIndex}
          currentFeatureIndex={currentFeatureIndex}
        /> */}
      </Box>

      <Footer />
    </Container>
  );
};

export default MicroFeatures;
