import React, { useEffect, useState, useRef } from 'react';
import TranslatedTextView from './TranslatedText';
import { isRTL } from '../utils/countriesConfig';
import { useSocket } from '../context/SocketContext';
import useTranslatedTextDisplay from '../hooks/useTranslatedTextDisplay';

const TranslationDisplay = React.memo(
  ({
    isMainMenuOpen,
    userTranslationLanguage,
    translationTextBoxRef,
    translationLanguage,
    onFinalText,
    isCardMode = false,
  }) => {
    const { socket } = useSocket();
    const [translatedTexts, setTranslatedTexts] = useState({ text: '' });
    const measurementRef = useRef(null);
    const languageDirection = isRTL(translationLanguage) ? 'rtl' : 'ltr';

    const addOrUpdateTranslatedText = useTranslatedTextDisplay(
      setTranslatedTexts,
      languageDirection,
    );

    useEffect(() => {
      const handleTranslatedText = ({ text, isFinal }) => {
        console.log(' handleTranslatedText', text);
        addOrUpdateTranslatedText(text, isFinal);
      };

      if (socket) {
        // Listen to translatedText events from the socket
        socket.on('translatedText', handleTranslatedText);
      }
      console.log(
        translatedTexts?.isFinal,
        translatedTexts?.text.trim(),
        'onFinalTexts',
      );

      return () => {
        if (socket) {
          socket.off('translatedText', handleTranslatedText);
        }
      };
    }, [socket, setTranslatedTexts]);

    useEffect(() => {
      if (
        translatedTexts.isFinal &&
        translatedTexts.text.trim() !== '' &&
        onFinalText
      ) {
        onFinalText(translatedTexts.text);

        setTranslatedTexts({ text: '', isFinal: false });
      }
    }, [translatedTexts]);

    const checkOverFlow = () => {
      const container = translationTextBoxRef.current;
      if (!container) return;

      if (container) {
        if (container.scrollHeight > container.clientHeight) {
          const words = translatedTexts.text.split(' ');

          let low = 0;
          let high = words.length - 1;
          let resultIndex = 0;

          const fitsWithinContainer = (startIndex) => {
            if (!measurementRef.current) return false;
            // Test text from startIndex to end
            const testText = words.slice(startIndex).join(' ');
            measurementRef.current.textContent = testText;
            // Now measure overflow in measurementRef
            return (
              measurementRef.current.scrollHeight <=
              measurementRef.current.clientHeight
            );
          };

          // Binary search
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (fitsWithinContainer(mid)) {
              // If it fits when removing mid words, try removing fewer
              resultIndex = mid;
              high = mid - 1;
            } else {
              // If it doesn't fit, remove more words
              low = mid + 1;
            }
          }

          const trimmedText = words.slice(resultIndex).join(' ');

          setTranslatedTexts((prev) => ({ ...prev, text: trimmedText }));
        }
      }
    };

    useEffect(() => {
      checkOverFlow();
    }, [translatedTexts]);

    return isCardMode ? (
      userTranslationLanguage &&
        translatedTexts?.text &&
        translatedTexts.text.length > 0 && (
          <TranslatedTextView
            translatedTexts={translatedTexts}
            translationLanguage={translationLanguage}
          />
        )
    ) : (
      <div
        id="translationTextBox"
        style={{
          position: 'fixed',
          color: '#25293B',
          paddingTop: '10px',
          background: '#fff',
          borderRadius: '30px 30px 0 0',
          fontSize: '12px',
          textAlign: 'center',
          lineHeight: '18px',
          fontWeight: 500,
          height: 182,
          width: '100%',
          animation: isMainMenuOpen
            ? 'moveUp 0.2s ease-in-out forwards'
            : 'moveDown 0.2s ease-in-out forwards',
        }}
      >
        <div
          ref={translationTextBoxRef}
          style={{
            padding: '10px',
            height: '75px',
            overflow: 'hidden',
          }}
        >
          {!userTranslationLanguage &&
            'Please select the language for translation'}
          {userTranslationLanguage &&
            translatedTexts?.text &&
            translatedTexts.text.length > 0 && (
              <TranslatedTextView
                translatedTexts={translatedTexts}
                translationLanguage={translationLanguage}
              />
            )}
          {userTranslationLanguage &&
            (!translatedTexts?.text || translatedTexts?.text.length === 0) &&
            'Translated text will appear here'}
        </div>
      </div>
    );
  },
);

TranslationDisplay.displayName = 'TranslationDisplay';

export default TranslationDisplay;
