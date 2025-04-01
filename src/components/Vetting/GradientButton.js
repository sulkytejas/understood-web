import React from 'react';
import { Button, useTheme } from '@mui/material';
import styled from '@emotion/styled';

const GradientButtonRoot = styled(Button)(({ responsiveStyles }) => ({
  padding: '18px 50px 22px 50px',
  gap: '10px',
  marginTop: '70px',
  fontSize: '24px',
  fontWeight: '700',
  color: '#fff',
  fontFamily: "'Exo 2', sans-serif",
  lineHeight: '28.8px',
  background: 'linear-gradient(90deg, #4ABBC9 0%, #ACEE5C 50%, #3DB141 100%)',
  borderRadius: '100px',
  border: '3px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 0 8px rgba(84, 215, 225, 0.4)', // Soft outer glow
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  transition: 'background-position 0.3s ease',

  '&:hover': {
    boxShadow: '0 0 12px rgba(84, 215, 225, 0.5)', // Stronger glow on hover
    background:
      'linear-gradient(84.86deg, #169CAC 0%, #82D023 49.83%, #1A911E 100%)',
  },

  '&:selected': {
    background: 'linear-gradient(84.86deg, #1DBBCE 0%, #19A01D 84.35%)',
  },

  '@media (max-width: 960px)': {
    marginTop: '25px',
    fontSize: '16px',
    lineHeight: '19.2px',
    padding: '12px 30px 16px 30px',
    border: '2px solid rgba(255, 255, 255, 0.5)',
  },

  ...responsiveStyles,
}));

const GradientButton = ({ responsiveStyles, ...props }) => {
  const theme = useTheme();

  return (
    <GradientButtonRoot
      theme={theme}
      responsiveStyles={{ ...responsiveStyles }}
      {...props}
    />
  );
};

export default GradientButton;
