import { useRef, useCallback, useEffect, useState } from 'react';
import { diff_match_patch } from 'diff-match-patch'; // Import diff-match-patch for text comparison
import he from 'he';
import throttle from 'lodash.throttle';

const dmp = new diff_match_patch();

const decodeText = (text) => {
  if (!text) return '';
  const decodedText = he.decode(text); // Decodes any HTML entities
  return decodedText;
};

const useTranslatedTextDisplay = (setTranslatedText) => {
  const removeTextTimeoutRef = useRef(null);
  const lastFinalTextRef = useRef(''); // Store last finalized text
  const [displayedText, setDisplayedText] = useState(''); // Track the displayed text

  const clearText = useCallback(() => {
    setTranslatedText({ text: '', isFinal: true }); // Clear the text
    setDisplayedText(''); // Reset displayed text
  }, [setTranslatedText]);

  const throttledUpdate = throttle(
    (textObj) => setTranslatedText(textObj),
    200,
  );

  const addOrUpdateTranslatedText = useCallback(
    (newText, isFinal, typingSpeed = 200) => {
      const lowerNewText = newText.toLowerCase().trim();
      const lowerDisplayedText = displayedText.toLowerCase().trim();

      // If final text, update the longest finalized text and reset the buffer
      if (isFinal) {
        lastFinalTextRef.current = lowerNewText;
        setDisplayedText(newText);
        throttledUpdate({
          text: decodeText(newText), // Display final text instantly
          isFinal,
        });
        return;
      }

      // Find the differences between the currently displayed text and the new text
      const diffs = dmp.diff_main(lowerDisplayedText, lowerNewText);

      // Process the diffs to determine where to start applying the typing effect
      let processedText = '';
      let typingText = ''; // This will hold the text that needs typing
      let isTypingNeeded = false;

      let lastWordIndex = lowerDisplayedText.split(' ').length - 1; // Find the index of the last word in the displayed text
      let wordCounter = 0; // Counter to track words

      diffs.forEach(([operation, part]) => {
        const words = part.split(' ');

        if (operation === 0) {
          // Unchanged text: display it instantly
          processedText += part;
          wordCounter += words.length;
        } else if (operation === 1) {
          // New text: only apply typing effect after the last word of the previous text
          if (wordCounter > lastWordIndex) {
            typingText += part;
            isTypingNeeded = true;
          } else {
            processedText += part; // Show without typing effect for the words before the last word
          }
          wordCounter += words.length;
        }
      });

      // Update the displayed text to include all the text that should be shown instantly
      setDisplayedText(processedText);

      // Apply typing effect to the new part only after the last word of the previous sentence
      if (isTypingNeeded && typingText) {
        const words = typingText.split(' ');
        words.forEach((word, i) => {
          setTimeout(() => {
            throttledUpdate((currentText) => {
              const updatedText = `${processedText}${processedText ? ' ' : ''}${currentText.text}${currentText.text ? ' ' : ''}${word}`;
              return { text: decodeText(updatedText), isFinal };
            });
          }, typingSpeed * i);
        });
      } else {
        // If no typing is needed, simply set the translated text
        throttledUpdate({ text: decodeText(processedText), isFinal });
      }

      //   if (!isFinal){
      //     clearTimeout(silenceTimeoutRef.current);
      //     silenceTimeoutRef.current = setTimeout(clearText, 5000);
      //   }

      // Clear previous timeout and set a new one to remove text after 3 seconds
      clearTimeout(removeTextTimeoutRef.current);
      removeTextTimeoutRef.current = setTimeout(() => {
        if (isFinal) {
          throttledUpdate({ text: '', isFinal: true }); // Clear the text
        }
      }, 3000);
    },
    [throttledUpdate, displayedText, clearText],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(removeTextTimeoutRef.current);
      //   clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  return addOrUpdateTranslatedText;
};

export default useTranslatedTextDisplay;
