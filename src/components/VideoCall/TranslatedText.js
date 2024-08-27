import { Box, Typography } from '@mui/material';

const TranslatedTextView = ({ translatedTexts }) => {
  return (
    <Box>
      {translatedTexts.map((text, index) => {
        // const totalTexts = translatedTexts.length;
        // const opacity = (index + 1) / totalTexts;
        // const scale = 1 - index * 0.1;
        // const fontSize = index === totalTexts - 1 ? 20 : 12;

        return <Typography key={index}>{text.text}</Typography>;
      })}
    </Box>
  );
};

export default TranslatedTextView;
