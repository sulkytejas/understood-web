import React, { useState, useRef } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import TranslationDisplay from '../VideoCall/TranslationDisplay';
import { useSelector } from 'react-redux';

const TranslationOverlay = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const translationTextBoxRef = useRef(null);

  const userTranslationLanguage =
    useSelector((state) => state.translation.localTranslationLanguage) ||
    localStorage.getItem('translationLanguagePreference') ||
    'en';

  const handleFinalText = (finalText) => {
    // push new item to chat
    if (finalText.trim()) {
      setChatHistory((prev) => [...prev, finalText]);
    }
  };

  console.log('chatHistory', chatHistory);
  return (
    <Box
      sx={{
        backgroundColor: '#eee',
        paddingTop: '20px',
        borderRadius: '24px 24px 0 0',
        height: 'calc(var(--vh) * 100)',
        // maxHeight: '932px',
      }}
    >
      {/* History Cards */}
      {chatHistory.map((chat, index) => (
        <Card
          key={index}
          sx={{ mt: 3, marginLeft: '16px', marginRight: '16px' }}
        >
          <CardContent>
            <Typography variant="body2">{chat}</Typography>
          </CardContent>
        </Card>
      ))}

      {/* Translation Display */}

      <Card sx={{ mt: 3, marginLeft: '16px', marginRight: '16px' }}>
        <CardContent>
          <TranslationDisplay
            isMainMenuOpen={false}
            userTranslationLanguage={userTranslationLanguage}
            translationLanguage={userTranslationLanguage}
            translationTextBoxRef={translationTextBoxRef}
            onFinalText={handleFinalText}
            isCardMode={true}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default TranslationOverlay;
