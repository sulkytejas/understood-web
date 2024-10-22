import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';
import { useSpring, animated } from 'react-spring';

const ListOverlay = ({ listItems, showList, title }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        padding: '15px',
        borderRadius: '8px',
        maxWidth: '80%',
        zIndex: 1000,
        opacity: showList ? 1 : 0,
        transition: 'opacity 0.5s',
      }}
    >
      <List>
        {title && <AnimatedListItem key={title} item={title} index={0} />}
        {listItems.map((item, index) => (
          <AnimatedListItem key={index + 1} item={item} index={index} />
        ))}
      </List>
    </Box>
  );
};

function AnimatedListItem({ item, index }) {
  const styles = useSpring({
    from: { opacity: 0, transform: 'translateY(-10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    delay: index * 100,
  });

  return (
    <animated.div style={styles}>
      <ListItem>
        <ListItemText
          primary={item}
          sx={{
            textDecoration: 'underline',
          }}
        />
      </ListItem>
    </animated.div>
  );
}

export default ListOverlay;
