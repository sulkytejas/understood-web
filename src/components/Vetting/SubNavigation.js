import { Button, Box } from '@mui/material';

const SubNavigation = ({
  featureList,
  onSetCurrentFeatureIndex,
  currentFeatureIndex,
}) => {
  return (
    <Box sx={{ marginBottom: '40px' }}>
      {featureList.map((feature, index) => (
        <Button
          key={feature}
          variant="outlined"
          onClick={() => {
            onSetCurrentFeatureIndex(index);
          }}
          sx={{
            textTransform: 'none',
            borderRadius: '100px',
            fontWeight: 600,
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '14px',
            lineHeight: '16.8px',
            backgroundColor: '#FFF',
            color: '#5A6D62',
            padding: '8px 10px',
            border: 'none', // default: no border
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
            },
            // Conditionally add the gradient border if selected
            ...(currentFeatureIndex === index && {
              '::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '100px',
                padding: '3px',
                background:
                  'linear-gradient(95.14deg, #4ABBC9 0%, #ACEE5C 49.83%, #3DB141 100%)',
                WebkitMask:
                  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              },
            }),
          }}
        >
          {feature}
        </Button>
      ))}
    </Box>
  );
};

export default SubNavigation;
