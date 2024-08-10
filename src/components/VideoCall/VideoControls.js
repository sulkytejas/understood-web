import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { Phone, Translate } from '@mui/icons-material';

const VideoControls = ({ callStarted, localTargetLanguage, setLocalTargetLanguage, onCallToggle }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLanguageChange = (lang) => {
        setLocalTargetLanguage(lang);
        handleClose();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="video-chat-controls">
            <div className={`control-icons ${callStarted && 'call-connected'}`}>
                <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                    {localTargetLanguage ? localTargetLanguage : <Translate />}
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                    <MenuItem value="en" onClick={() => handleLanguageChange('en')}>English</MenuItem>
                    <MenuItem value="ru" onClick={() => handleLanguageChange('ru')}>Russian</MenuItem>
                    <MenuItem value="hi" onClick={() => handleLanguageChange('hi')}>Hindi</MenuItem>
                </Menu>
                <IconButton onClick={() => onCallToggle(!callStarted)}>
                    <Phone style={{ color: callStarted ? 'red' : 'green' }} />
                </IconButton>
            </div>
        </div>
    );
};

export default VideoControls;
