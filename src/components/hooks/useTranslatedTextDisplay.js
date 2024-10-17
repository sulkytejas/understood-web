import { useRef, useCallback, useEffect } from 'react';

const useTranslatedTextDisplay = (setTranslatedTexts) => {
  // Refs to persist values across renders without causing re-renders
  const removeTextTimeoutRef = useRef(null);
  const lastInterimTimestampRef = useRef(Date.now());

  const addOrUpdateTranslatedText = useCallback(
    (text, isFinal, typingSpeed = 200) => {
      const words = text.split(' ');

      words.forEach((word, i) => {
        setTimeout(() => {
          setTranslatedTexts((currentTexts) => {
            let updatedTexts = [...currentTexts];
            let displayedText = updatedTexts.length ? updatedTexts[0].text : '';

            if (!displayedText.includes(word)) {
              const newText = `${displayedText}${i > 0 ? ' ' : ''}${word}`;
              updatedTexts[0] = {
                text: newText,
                isFinal,
              };
            }

            // Keep only the latest text
            if (updatedTexts.length > 1) {
              updatedTexts = updatedTexts.slice(-1);
            }

            return updatedTexts;
          });
        }, typingSpeed * i);
      });

      // Clear previous timeout
      clearTimeout(removeTextTimeoutRef.current);

      // Update the last interim timestamp
      lastInterimTimestampRef.current = Date.now();

      // Set a new timeout to remove the text after 3 seconds
      removeTextTimeoutRef.current = setTimeout(() => {
        const timeSinceLastInterim =
          Date.now() - lastInterimTimestampRef.current;

        if (timeSinceLastInterim >= 3000 && isFinal) {
          setTranslatedTexts(() => []); // Clear the text
        }
      }, 3000);
    },
    [setTranslatedTexts],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(removeTextTimeoutRef.current);
    };
  }, []);

  return addOrUpdateTranslatedText;
};

export default useTranslatedTextDisplay;
