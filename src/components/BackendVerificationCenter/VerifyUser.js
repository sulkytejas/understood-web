import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

import WavyUnderlineText from './waveUnderlineText';
import VerificationLevelOne from './VerificationLevelOne';
import VerificationLevelTwo from './VerificationLevelTwo';

const VerifyUser = () => {
  const [expanded, setExpanded] = useState('level1');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      sx={{
        padding: '50px 0',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Exo 2',
          fontSize: '48px',
          lineHeight: '140%',
          textTransform: 'uppercase',
          padding: '20px',
          color: '#0C2617',
          textAlign: 'center',
          mb: 4,
        }}
      >
        <WavyUnderlineText>Verify </WavyUnderlineText>{' '}
        <WavyUnderlineText>Users </WavyUnderlineText>
      </Typography>

      <Box sx={{ px: 3 }}>
        <Accordion
          expanded={expanded === 'level1'}
          onChange={handleChange('level1')}
          sx={{
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px !important',
            '&:before': {
              display: 'none',
            },
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="level1-content"
            id="level1-header"
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              '&.Mui-expanded': {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
              '& .MuiAccordionSummary-content': {
                margin: '20px 0',
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Exo 2',
                fontSize: '24px',
                fontWeight: 600,
                color: '#0C2617',
              }}
            >
              Level 1 Verification
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: 0,
              backgroundColor: '#ffffff',
            }}
          >
            <VerificationLevelOne />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === 'level2'}
          onChange={handleChange('level2')}
          sx={{
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px !important',
            '&:before': {
              display: 'none',
            },
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="level2-content"
            id="level2-header"
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              '&.Mui-expanded': {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              },
              '& .MuiAccordionSummary-content': {
                margin: '20px 0',
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Exo 2',
                fontSize: '24px',
                fontWeight: 600,
                color: '#0C2617',
              }}
            >
              Level 2 Verification
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              padding: 0,
              backgroundColor: '#ffffff',
            }}
          >
            <VerificationLevelTwo />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default VerifyUser;
