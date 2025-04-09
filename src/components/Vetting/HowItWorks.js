/* eslint-disable */
import React, { useRef, useEffect } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

import SignupImage from '../assets/Sign_Up.png';
import ConnectImage from '../assets/Connect.png';
import CreateMeetingImage from '../assets/Create_Meeting.png';

import { ReactComponent as StrokesSVG } from '../assets/how_works_desktop.svg';
import { ReactComponent as StrokesSVGMobile } from '../assets/how_works_mobile.svg';

const CircleWithLines = ({ isFirst, isLast }) => (
  <Box
    sx={(theme) => ({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '30px',
      height: '30px',
      border: '2px solid #555',
      borderRadius: '50%',
      '& > *': {
        width: '4px',
        height: '4px',
        backgroundColor: '#555',
        borderRadius: '50%',
      },
      // Line before the circle
      '&::before': !isFirst && {
        content: '""',
        position: 'absolute',
        [theme.breakpoints.up('md')]: {
          left: '-275px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '275px',
          borderTop: '2px dashed #555',
        },
        [theme.breakpoints.down('sm')]: {
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '100px',
          borderLeft: '2px dashed #555',
        },
      },
      // Line after the circle
      '&::after': !isLast && {
        content: '""',
        position: 'absolute',
        [theme.breakpoints.up('md')]: {
          right: '-275px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '275px',
          borderTop: '2px dashed #555',
        },
        [theme.breakpoints.down('sm')]: {
          bottom: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '100px',
          borderLeft: '2px dashed #555',
        },
      },
    })}
  >
    <Box />
  </Box>
);

const StepComponent = ({
  isFirst,
  isLast,
  stepNumber,
  title,
  description,
  imageSrc,
  isInverse = false,
  alt,
  aria_describedby,
  ariaDesciption,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '200px', // Adjust as needed
      }}
    >
      {/* Circle */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <CircleWithLines isFirst={isFirst} isLast={isLast} />
      </Box>

      {/* Logo */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: `calc(50% - ${isInverse ? '0px' : '50px'})`, // 50px to the left of the circle
          transform: 'translate(-100%, -50%)',
        }}
      >
        {!isInverse ? (
          <img
            src={imageSrc}
            alt="logo"
            style={{
              width: isMobile ? '50px' : '80px',
              height: isMobile ? '50px' : '80px',
            }}
          />
        ) : (
          <Box>
            <Typography
              sx={{
                color: '#5A6D62',
                paddingTop: { xs: '5px', md: '10px' },
              }}
            >
              {stepNumber}
            </Typography>
            {/* Title */}
            <Typography
              sx={{
                fontFamily: "'Exo 2'",
                fontWeight: '700',
                fontSize: { xs: '20px', md: '32px' },
                color: '#0C2617',
                marginTop: { xs: 0, md: '8px' },
                lineHeight: { xs: '28px', md: '44.8px' },
              }}
            >
              {title}
            </Typography>
            {/* Description */}
            <Typography
              sx={{
                fontSize: { xs: '14px', md: '20px' },
                color: '#5A6D62',
                lineHeight: { xs: '20px', md: '28px' },
                marginTop: '8px',
              }}
            >
              {description}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Text */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 'calc(50% + 50px)', // 50px to the right of the circle
          transform: 'translateY(-50%)',
          maxWidth: '140px',
          textAlign: 'left',
        }}
      >
        {!isInverse ? (
          <Box>
            {/* Step Number */}
            <Typography
              sx={{
                color: '#5A6D62',
                paddingTop: { xs: '5px', md: '10px' },
              }}
            >
              {stepNumber}
            </Typography>
            {/* Title */}
            <Typography
              sx={{
                fontFamily: "'Exo 2'",
                fontWeight: '700',
                fontSize: { xs: '20px', md: '32px' },
                color: '#0C2617',
                marginTop: { xs: 0, md: '8px' },
                lineHeight: { xs: '28px', md: '44.8px' },
              }}
            >
              {title}
            </Typography>
            {/* Description */}
            <Typography
              sx={{
                fontSize: { xs: '14px', md: '20px' },
                color: '#5A6D62',
                lineHeight: { xs: '20px', md: '28px' },
                marginTop: '8px',
              }}
            >
              {description}
            </Typography>
          </Box>
        ) : (
          <img
            src={imageSrc}
            alt={alt}
            style={{
              width: isMobile ? '50px' : '80px',
              height: isMobile ? '50px' : '80px',
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'none' }}>
        <p id={aria_describedby} style={{ display: 'none' }}>
          {ariaDesciption}
        </p>
      </Box>
    </Box>
  );
};

const HowItWorks = ({ scrollRef }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const strokeAnimationRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('stroke-animation'); // Add the animation class
            observer.unobserve(entry.target); // Stop observing once animation starts
          }
        });
      },
      {
        threshold: 0.1, // Adjust based on how much of the element needs to be visible
      },
    );

    if (strokeAnimationRef.current) {
      observer.observe(strokeAnimationRef.current); // Observe the target element
    }

    return () => {
      if (strokeAnimationRef.current) {
        observer.unobserve(strokeAnimationRef.current); // Clean up observer on unmount
      }
    };
  }, []);

  return (
    <Box
      sx={{
        margin: '0 auto',
        padding: { xs: '50px 15px', md: '80px' },
        borderRadius: { xs: '30px', md: '80px' },
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'left',
        marginTop: { xs: '30px', md: '100px' },
        backgroundColor: '#FFF',
        position: 'relative',
      }}
      ref={scrollRef}
    >
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        >
          <StrokesSVG />
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: {
            xs: '100%',
            md: '1700px',
            padding: { xs: '0 16px', md: '0' },
          },
        }}
      >
        <Typography
          sx={{
            fontWeight: '700',
            fontFamily: "'Exo 2'",
            lineHeight: { xs: '33.6px', md: '67.2px' },
            fontSize: { xs: '24px', md: '48px' },
            color: '#0C2617',
          }}
        >
          HOW IT WORKS?
        </Typography>
        <Typography
          sx={{
            fontWeight: '400',
            fontFamily: "'Jost', sans-serif",
            lineHeight: { xs: '23.12px', md: '28.9px' },
            fontSize: { xs: '16px', md: '20px' },
            paddingTop: '20px',
            color: '#5A6D62',
            width: '100%',
            textAlign: 'justify',
          }}
        >
          You get one complimentary report and payment is from second report
          onwards
        </Typography>

        {isMobile ? (
          <Box
            sx={{
              width: '100%',
            }}
          >
            <StepComponent
              isFirst={true}
              isLast={false}
              stepNumber="01"
              title="Complete the Form"
              description="Fill our simple 2-minute form to specify exactly what insights your business needs."
              imageSrc={SignupImage}
              alt="User icon with a plus symbol for the sign-up process."
              aria_describedby="sign-up-description"
              ariaDesciption="Step 1 of the process, where users register to get started on the app."
            />
            <StepComponent
              isFirst={false}
              isLast={false}
              stepNumber="02"
              title="Make Payment"
              description="We are manually processing the payment till we build our payment gateway"
              imageSrc={CreateMeetingImage}
              isInverse={true}
              alt="Two user icons connected by a circle representing meeting creation."
              aria_describedby="create-meeting-description"
              ariaDesciption="Step 2 of the process, where users create a meeting by saying a unique word and choosing a color."
            />
            <StepComponent
              isFirst={false}
              isLast={true}
              stepNumber="03"
              title="Receive Your Report"
              description="Get actionable, expert-verified supplier intelligence delivered to your inbox within 24 hours."
              imageSrc={ConnectImage}
              alt="Icon showing a globe with user icons, symbolizing global connection."
              aria_describedby="connect-description"
              ariaDesciption="Step 3 of the process, where users connect with each other instantly after completing the setup."
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%', // Full width of the parent container
              margin: '0 auto',
              padding: { xs: '50px 0', md: '92px 0 20px 0 ' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: '167px', md: 'unset' },
            }}
          >
            {/* Circle with Dot - Step 1 */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'center', md: 'start' },
                position: 'relative',
                justifyContent: { xs: 'space-between', md: 'unset' },
              }}
            >
              {/* Logo */}
              <img
                src={SignupImage}
                style={{
                  width: isMobile ? '50px' : '80px',
                  height: isMobile ? '50px' : '80px',
                  marginBottom: '25px',
                  flexGrow: 1,
                }}
                aria-describedby="connect-description"
                alt="Icon showing a globe with user icons, symbolizing global connection."
              />

              <CircleWithLines isFirst={true} isLast={false} />

              {/* Text Below */}
              <Box
                sx={{
                  flexGrow: 1,
                }}
              >
                <Typography
                  sx={{
                    color: '#5A6D62',
                    paddingTop: { xs: '5px', md: '10px' },
                  }}
                >
                  01
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Exo 2'",
                    fontWeight: '700',
                    fontSize: { xs: '20px', md: '32px' },
                    color: '#OC2617',
                    marginTop: { xs: 0, md: '8px' },
                    lineHeight: { xs: '28px', md: '44.8px' },
                  }}
                >
                  Complete the Form
                </Typography>
                {!isMobile && (
                  <Typography
                    sx={{
                      fontSize: { xs: '14px', md: '20px' },
                      color: '#5A6D62',
                      lineHeight: { xs: '20px', md: '22.9px' },
                    }}
                  >
                    {isMobile
                      ? 'Register easily to get started.'
                      : `Fill our simple 2-minute form to specify exactly what insights your business needs.`}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Circle with Dot - Step 2 */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'center', md: 'start' },
                position: 'relative',
                justifyContent: { xs: 'space-between', md: 'unset' },
              }}
            >
              {/* Logo */}
              <img
                src={CreateMeetingImage}
                alt="Two user icons connected by a circle representing meeting creation."
                style={{
                  width: isMobile ? '50px' : '80px',
                  height: isMobile ? '50px' : '80px',
                  marginBottom: '25px',
                  flexGrow: isMobile ? 1 : 'unset',
                }}
                aria-describedby="create-meeting-description"
              />

              <CircleWithLines isFirst={false} isLast={false} />

              {/* Text Below */}
              <Box
                sx={{
                  flexGrow: { xs: 1, md: 'unset' },
                }}
              >
                <Typography
                  sx={{
                    color: '#5A6D62',
                    paddingTop: { xs: '5px', md: '10px' },
                  }}
                >
                  02
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Exo 2'",
                    fontWeight: '700',
                    fontSize: { xs: '20px', md: '32px' },
                    color: '#OC2617',
                    marginTop: { xs: 0, md: '8px' },
                    lineHeight: { xs: '28px', md: '44.8px' },
                  }}
                >
                  Payment
                </Typography>
                {!isMobile && (
                  <Typography
                    sx={{
                      fontSize: { xs: '14px', md: '20px' },
                      color: '#5A6D62',
                      lineHeight: { xs: '20px', md: '22.9px' },
                    }}
                  >
                    {isMobile
                      ? 'Select a color and say a word to create a meeting.'
                      : 'We are manually processing the payment till we build our payment gateway'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Circle with Dot - step 3*/}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: { xs: 'center', md: 'start' },
                position: 'relative',
                justifyContent: { xs: 'space-between', md: 'unset' },
              }}
            >
              {/* Logo */}
              <img
                src={ConnectImage}
                alt="Icon showing a globe with user icons, symbolizing global connection."
                style={{
                  width: isMobile ? '50px' : '80px',
                  height: isMobile ? '50px' : '80px',
                  marginBottom: '25px',
                  flexGrow: isMobile ? 1 : 'unset',
                }}
                aria-describedby="connect-description"
              />

              <CircleWithLines isFirst={false} isLast={true} />

              {/* Text Below */}
              <Box
                sx={{
                  flexGrow: { xs: 1, md: 'unset' },
                }}
              >
                <Typography
                  sx={{
                    color: '#5A6D62',
                    paddingTop: { xs: '5px', md: '10px' },
                  }}
                >
                  03
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Exo 2'",
                    fontWeight: '700',
                    fontSize: { xs: '20px', md: '32px' },
                    color: '#OC2617',
                    marginTop: { xs: 0, md: '8px' },
                    lineHeight: { xs: '28px', md: '44.8px' },
                  }}
                >
                  Report
                </Typography>
                {!isMobile && (
                  <Typography
                    sx={{
                      fontSize: { xs: '14px', md: '20px' },
                      color: '#5A6D62',
                      lineHeight: { xs: '20px', md: '22.9px' },
                    }}
                  >
                    {isMobile
                      ? 'Other users can connect by saying the same word.'
                      : ` supplier intelligence delivered to your inbox within 24 hours.
`}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'none' }}>
              <p id="sign-up-description" style={{ display: 'none' }}>
                Step 1 of the process, where users register to get started on
                the app.
              </p>
              <p id="create-meeting-description" style={{ display: 'none' }}>
                Step 2 of the process, where users create a meeting by saying a
                unique word and choosing a color.
              </p>
              <p id="connect-description" style={{ display: 'none' }}>
                Step 3 of the process, where users connect with each other
                instantly after completing the setup.
              </p>
            </Box>
          </Box>
        )}
      </Box>
      {isMobile && (
        <Box
          ref={strokeAnimationRef}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
          }}
        >
          <StrokesSVGMobile />
        </Box>
      )}
    </Box>
  );
};

export default HowItWorks;
