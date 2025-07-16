import React, { useState } from 'react';
import {
  Box,
  List,
  Popover,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import ReactCountryFlag from 'react-country-flag';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { styled } from '@mui/system';
import { CountrySelectButton } from './Login.styles';

const AnimatedArrow = styled(ArrowDropDownIcon)(({ animate }) => ({
  ...(animate && {
    animation: `pulse 1s infinite`,
  }),
}));

function CountrySelector({ value, onChange, labels }) {
  const countries = getCountries();
  const defaultCountry = '';

  const selectedCode = value || defaultCountry;
  const [anchorEl, setAnchorEl] = useState(null);

  const options = countries.map((country) => ({
    code: country,
    label: labels[country],
    callingCode: `+${getCountryCallingCode(country)}`,
  }));

  const selectedOption =
    options.find((opt) => opt.code === selectedCode) ||
    options.find((opt) => opt.code === defaultCountry);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <CountrySelectButton onClick={handleOpen}>
        {selectedOption && (
          <ReactCountryFlag
            countryCode={selectedOption.code.toUpperCase()}
            svg
            style={{
              width: '20px',
              height: 'auto',
              borderRadius: '2px',
              marginRight: '6px',
            }}
          />
        )}
        <AnimatedArrow sx={{ zIndex: 2 }} animate={!selectedOption} />
      </CountrySelectButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          style: { maxWidth: '400px', maxHeight: 400, width: '100%' },
        }}
      >
        <Box sx={{ padding: '8px' }}>
          <List sx={{ padding: 0 }}>
            {options.map((option) => (
              <ListItemButton
                key={option.code}
                onClick={() => {
                  onChange(option.code);
                  handleClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: '32px' }}>
                  <ReactCountryFlag
                    countryCode={option.code}
                    svg
                    style={{
                      width: '20px',
                      height: 'auto',
                      borderRadius: '2px',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${option.label} (${option.callingCode})`}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
}

export default React.memo(CountrySelector);
