import React from 'react';
import Translation from '../Translation/Translation';

const TranslationOverlay = ({ detectedLanguage, localTargetLanguage, userRole, socket }) => {
    return (
        detectedLanguage && (
            <Translation
                socket={socket}  // Pass the socket object here
                role={userRole}
                detectedLanguage={detectedLanguage}
                targetLanguage={localTargetLanguage}
            />
        )
    );
};

export default TranslationOverlay;
