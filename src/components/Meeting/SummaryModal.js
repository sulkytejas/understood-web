import React, { useEffect, useState, useRef } from 'react';
import { Box, Modal, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const RenderBulletList = ({ title, items }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </Box>
  );
};

const SummaryModal = ({ open, setOpen, meetingId }) => {
  const { t } = useTranslation();
  const localTranslationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );

  const [meetingSummary, setMeetingSummary] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const MAX_DURATION = 30000; // 30s
  const POLL_INTERVAL = 1000; // 1s

  // -- Polling function that tries to fetch the summary
  const handleSummary = async () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const locale = localTranslationLanguage || 'en-US';

    try {
      const res = await fetch(
        `${apiUrl}/api/meetingNotes/${meetingId}/${locale}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (res.ok) {
        const data = await res.json();
        // Adjust this logic to match the actual shape of your data
        if (data?.response) {
          setMeetingSummary(data.response);
          return true;
        }
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
    return false;
  };

  useEffect(() => {
    if (open) {
      // 1. Reset everything once the modal opens
      setMeetingSummary(null);
      setProgress(0);

      // 2. Capture a consistent startTime now
      const startTime = Date.now();

      // 3. Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 4. Start the interval
      timerRef.current = setInterval(async () => {
        const elapsed = Date.now() - startTime;

        // (a) Stop if we exceed max time
        if (elapsed >= MAX_DURATION) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setProgress(100);
          return;
        }

        // (b) Try to fetch summary
        const foundSummary = await handleSummary();
        if (foundSummary) {
          // Summary found -> jump to 100, stop
          setProgress(100);
          clearInterval(timerRef.current);
          timerRef.current = null;
          return;
        }

        // (c) Otherwise, accelerate progress using an "ease-in" approach
        const fraction = elapsed / MAX_DURATION; // from 0 to 1
        const easedProgress = Math.pow(fraction, 1.5) * 100;
        setProgress(easedProgress);
      }, POLL_INTERVAL);
    } else {
      // If modal closed, clear any timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup if the component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [open, meetingId, localTranslationLanguage]);
  // ^ include relevant deps if they can change

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          outline: 'none',
          textAlign: 'center',
          width: { xs: '100%', md: 'unset' },
          maxWidth: '800px',
          minHeight: '200px',
        }}
      >
        {!meetingSummary ? (
          // Show Loader
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={progress}
                size={80}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  component="div"
                  color="text.secondary"
                >
                  {`${Math.round(progress)}%`}
                </Typography>
              </Box>
            </Box>
            {progress >= 100 && (
              <Typography sx={{ mt: 2 }}>{t('No Summary Found')}</Typography>
            )}
          </Box>
        ) : (
          // Show Summary
          <Box>
            <Typography
              id="custom-modal-title"
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: '36px',
                lineHeight: '50.4px',
                paddingBottom: '20px',
                textTransform: 'capitalize',
              }}
            >
              {meetingSummary?.conversation_type}
            </Typography>
            <Typography
              id="custom-modal-description"
              sx={{ fontSize: '20px', lineHeight: '28.9px' }}
            >
              {meetingSummary?.summary ?? t('No Summary Found')}
            </Typography>

            <Box sx={{ textAlign: 'left', padding: '10px 10px' }}>
              {/* Teaching Sessions */}
              {meetingSummary?.teaching_sessions?.concepts_covered?.length >
                0 && (
                <RenderBulletList
                  title={t('Concepts Covered')}
                  items={meetingSummary?.teaching_sessions?.concepts_covered}
                />
              )}

              {meetingSummary?.teaching_sessions?.session_highlights?.length >
                0 && (
                <RenderBulletList
                  title={t('Session Highlights')}
                  items={meetingSummary?.teaching_sessions?.session_highlights}
                />
              )}

              {meetingSummary?.teaching_sessions?.insights?.length > 0 && (
                <RenderBulletList
                  title={t('Insights')}
                  items={meetingSummary?.teaching_sessions?.insights}
                />
              )}

              {/* Casual Conversation */}
              {meetingSummary?.casual_conversations?.topics_discussed?.length >
                0 && (
                <RenderBulletList
                  title={t('Topics Discussed')}
                  items={meetingSummary?.casual_conversations?.topics_discussed}
                />
              )}

              {meetingSummary?.casual_conversations?.notable_comments?.length >
                0 && (
                <RenderBulletList
                  title={t('Notable Comments')}
                  items={meetingSummary?.casual_conversations?.notable_comments}
                />
              )}

              {meetingSummary?.casual_conversations?.general_tone?.length >
                0 && (
                <RenderBulletList
                  title={t('Ambiance')}
                  items={meetingSummary?.casual_conversations?.general_tone}
                />
              )}

              {/* Business Meeting */}
              {meetingSummary?.business_meeting?.decisions?.length > 0 && (
                <RenderBulletList
                  title={t('Decisions')}
                  items={meetingSummary?.business_meeting?.decisions}
                />
              )}

              {meetingSummary?.business_meeting?.discussion_points?.length >
                0 && (
                <RenderBulletList
                  title={t('Discussion Points')}
                  items={meetingSummary?.business_meeting?.discussion_points}
                />
              )}

              {meetingSummary?.business_meeting?.action_items?.length > 0 && (
                <RenderBulletList
                  title={t('Action Items')}
                  items={meetingSummary?.business_meeting?.action_items}
                />
              )}

              {meetingSummary?.business_meeting?.deadlines?.length > 0 && (
                <RenderBulletList
                  title={t('Deadlines')}
                  items={meetingSummary?.business_meeting?.deadlines}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default SummaryModal;
