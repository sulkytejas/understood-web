import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Rating, Modal } from '@mui/material';
import { styled } from '@mui/system';
import { ReactComponent as LogoIcon } from '../assets/understood_logo_text.svg';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  minHeight: '100vh', // Full viewport height
}));

const Container = styled(Box)(({ theme }) => ({
  margin: '16px',
  marginTop: theme.spacing(8),
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: '#F1F0F0', // Light teal background
  position: 'relative',
}));

const RatingCard = styled(Box)(({ theme }) => ({
  backgroundColor: '#DF4303', // Orange background
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  minHeight: '139px',
  boxShadow:
    ' 0px 9px 19px rgba(0, 0, 0, 0.1),0px 35px 35px rgba(0, 0, 0, 0.09)',
}));

const JoinButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: '#000',
  textTransform: 'none',
  fontWeight: 'bold',
  backgroundColor: 'transparent',
}));
const StyledLogoBox = styled(Box)(() => ({
  zIndex: 2,
  textAlign: 'center',
}));

const MeetingEnded = () => {
  const [value, setValue] = useState(0);
  const [meetingSummary, setMeetingSummary] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [ratingWidth, setRatingWidth] = useState(0);
  const ratingRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();

  // Get the "meetingId" query parameter
  const meetingId = searchParams.get('meetingId');

  useEffect(() => {
    if (ratingRef.current) {
      setRatingWidth(ratingRef.current.offsetWidth);
    }
  }, [ratingRef.current]);

  const handleRatingChange = (_, newValue) => {
    if (newValue !== null) {
      setValue(newValue);
    }
  };

  const handleJoinCallClick = async () => {
    if (meetingId) {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await fetch(`${apiUrl}/api/submitRating`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            rating: value,
          }),
        });

        if (response.ok) {
          console.log('Rating submitted successfully');
          navigate('/login', { state: { fromMeetingEnded: true } });
          window.location.reload();
        } else {
          console.error('Failed to submit rating');
        }
      } catch (error) {
        console.error('Error submitting rating:', error);
      }
    } else {
      navigate('/login', { state: { fromMeetingEnded: true } });
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleSummary = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      const locale = 'en-US';
      const res = await fetch(
        `${apiUrl}/api/meetingNotes/${meetingId}/${locale}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.ok) {
        const response = await res.json();
        setMeetingSummary({ ...response?.response });
      }
    };

    handleSummary();
  }, []);

  return (
    <PageContainer>
      <StyledLogoBox>
        <LogoIcon width={240} /> {/* Adjust the width as necessary */}
      </StyledLogoBox>
      <Container>
        <Typography
          sx={{
            color: '#000',
            fontWeight: 600,
            textAlign: 'center',
            fontSize: '20px',
            lineHeight: '30px',
            paddingTop: '50px',
            paddingBottom: '25px',
          }}
        >
          {t('Meeting Ended!')}
        </Typography>

        <RatingCard>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '18px',
              marginTop: '15px',
            }}
          >
            {t('How was the quality of the call?')}
          </Typography>
          <Rating
            name="rating"
            ref={ratingRef}
            value={value}
            onChange={handleRatingChange}
            precision={0.5}
            size="large"
            sx={{
              color: '#F4C430', // Yellow color for stars
              marginTop: '15px',
              marginBottom: '8px',

              '& .MuiRating-icon': {
                margin: ' 0 12px', // Increase space between stars
              },
              '& .MuiRating-iconEmpty': {
                margin: '0 12px', // Ensure empty stars have the same spacing
              },
            }}
          />
          <Box
            display="flex"
            justifyContent="space-between"
            sx={{
              width: `${ratingWidth}px`,
              margin: 'auto',
              paddingTop: '25px',
            }}
          >
            <Typography
              variant="caption"
              color="white"
              sx={{ marginLeft: '12px' }}
            >
              {t('Very bad')}
            </Typography>
            <Typography
              variant="caption"
              color="white"
              sx={{ marginLeft: '12px' }}
            >
              {t('Excellent')}
            </Typography>
          </Box>
        </RatingCard>
        <JoinButton
          onClick={handleJoinCallClick}
          fullWidth
          sx={{ fontWeight: '400', fontSize: '14px' }}
        >
          {t('Join again ')}
        </JoinButton>
        <JoinButton
          onClick={() => setOpenModal(true)}
          fullWidth
          sx={{ fontWeight: '400', fontSize: '14px' }}
        >
          {t('View Summary')}
        </JoinButton>
      </Container>
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
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
          }}
        >
          <Typography
            id="custom-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: '36px',
              lineHeight: '50.4px',
              paddingBottom: '20px',
            }}
          >
            {t('Meeting Summary')}
          </Typography>
          <Typography
            id="custom-modal-description"
            sx={{
              fontSize: '20px',
              lineHeight: '28.9px',
            }}
          >
            {meetingSummary && meetingSummary.summary}
          </Typography>
        </Box>
      </Modal>
    </PageContainer>
  );
};

export default MeetingEnded;
