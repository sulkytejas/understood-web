import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { ReactComponent as WaveUnderline } from '../assets/wave_underline.svg';

function WavyUnderlineText({ children, sxSVG, sxContainer }) {
  const textRef = useRef(null);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, []);

  return (
    <Box position="relative" display="inline-block">
      <Typography ref={textRef} variant="span">
        {children}
      </Typography>

      <Box
        component="span"
        sx={{
          position: 'absolute',
          left: 0,
          width: textWidth,
          display: 'flex',
          ...sxContainer,
        }}
      >
        <WaveUnderline
          style={{
            width: '100%',
            height: 'auto',
            ...sxSVG,
          }}
        />
      </Box>
    </Box>
  );
}

export default WavyUnderlineText;
