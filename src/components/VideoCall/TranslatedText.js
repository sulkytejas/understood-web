import { Box, Typography } from '@mui/material';

const TranslatedTextView = ({ translatedTexts }) => {
  console.log(translatedTexts.text, 'translatedTexts');
  const isFinal = translatedTexts.isFinal;

  return (
    <Box
      sx={{
        maxHeight: '90px',
        overflow: 'hidden',
      }}
    >
      <Typography
        style={{
          margin: '5px',
          fontSize: '14px',
          textAlign: 'left',
          whiteSpace: 'normal',
          fontWeight: isFinal ? 600 : 300,
          color: isFinal ? 'black' : '#333',
          transition: 'color 0.5s ease-in-out, font-weight 0.5s ease-in-out',
        }}
        key="1"
      >
        {translatedTexts.text}
      </Typography>
    </Box>
  );
};

export default TranslatedTextView;
