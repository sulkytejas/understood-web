import React, { useEffect } from 'react';
import { Button } from '@mui/material';
import { feedbackIntegration } from '@sentry/react';
import { useTranslation } from 'react-i18next';

function ReportBugButton() {
  const { t } = useTranslation();
  // We’ll attach the feedback logic once the component mounts
  useEffect(() => {
    // Grab the Feedback integration from that client
    const feedback = feedbackIntegration({
      // Disable the injection of the default widget
      autoInject: false,
    });

    if (feedback) {
      // Attach the feedback form to your custom button with ID #my-report-bug
      feedback.attachTo(document.querySelector('#my-report-bug'), {
        // Customize the form here
        formTitle: 'Report a Bug!',
        subtitle: 'Please describe what went wrong.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelSubmit: 'Send',
        // ...any other available config you want
      });
    }
  }, []);

  return (
    <Button
      id="my-report-bug"
      variant="text"
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        p: 2, // optional padding
        // optionally add background or other styling here
      }}
    >
      {t('Something went wrong? Report a bug!')}
    </Button>
  );
}

export default ReportBugButton;
