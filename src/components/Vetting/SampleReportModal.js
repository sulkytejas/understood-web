import React from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function SampleReportModal({ open, handleClose }) {
  const driveFileId = '1bTuAusWQ1wY4v3J2Uqm-p1fHfZ_qYxr7';
  const embedUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="sample-report-modal"
      aria-describedby="view-sample-supplier-report"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '90%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 2,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h2">
            Sample Supplier Report
          </Typography>
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            title="Sample Supplier Report"
            style={{ border: 'none' }}
            allow="autoplay"
          />
        </Box>
      </Box>
    </Modal>
  );
}

export default SampleReportModal;
