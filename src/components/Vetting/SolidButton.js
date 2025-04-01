import React from 'react';
import { Button } from '@mui/material';
import styled from '@emotion/styled';

const SolidButtonRoot = styled(Button)(({ responsiveStyles }) => ({
  backgroundColor: '#0C2617',
  color: '#FFFFFF',
  padding: '12px 40px',
  borderRadius: '100px',
  fontWeight: 'bold',
  border: '3px #FFFFFF4D solid',
  transition: 'background-position 0.3s ease',
  '&:hover': {
    // backgroundColor: "#333333",
    background:
      'linear-gradient(84.86deg, #169CAC 0%, #82D023 49.83%, #1A911E 100%)',
  },

  '&:selected': {
    background: 'linear-gradient(84.86deg, #1DBBCE 0%, #19A01D 84.35%)',
  },

  '@media (max-width: 960px)': {
    padding: '12px 25px 16px 25px',
    border: '2px #FFFFFF4D solid',
    fontSize: '14px',
    lineHeight: '16.8px',
  },

  responsiveStyles,
}));

const SolidButton = ({ responsiveStyles, ...props }) => {
  return (
    <SolidButtonRoot responsiveStyles={{ ...responsiveStyles }} {...props} />
  );
};

export default SolidButton;
