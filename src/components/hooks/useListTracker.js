import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSelector } from 'react-redux';

const useListTracker = () => {
  const [listItems, setListItems] = useState([]);
  const [showList, setShowList] = useState(false);
  const [title, setTitle] = useState('');

  const { socket } = useSocket();
  const meetingId = useSelector((state) => state.meeting.meetingId);

  console.log(
    listItems,
    'listItems',
    showList,
    'showList',
    meetingId,
    'meetingId',
  );
  useEffect(() => {
    if (socket) {
      socket.on('listStart', (data) => {
        console.log(data, 'listStart');
        if (data?.meetingId === meetingId) {
          setShowList(true);
          setListItems([]);
          setTitle(data.title);
        }
      });

      socket.on('listUpdate', (data) => {
        console.log(data, 'listItems listUpdate');
        if (data?.meetingId === meetingId) {
          if (data?.listItems.length > 0) {
            if (!showList) {
              setShowList(true);
            }
            setListItems((prevItems) => [
              ...prevItems,
              ...data.listItems.filter(
                (item) =>
                  !prevItems.some(
                    (existingItem) =>
                      existingItem.toLowerCase() === item.toLowerCase(),
                  ),
              ),
            ]);
          }
        }
      });

      socket.on('listComplete', (data) => {
        if (data?.meetingId === meetingId) {
          setShowList(false);
          setTimeout(() => {
            setListItems([]);
          }, 500); // Matches the fade-out duration
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('listStart');
        socket.off('listUpdate');
        socket.off('listComplete');
      }
    };
  }, [socket, meetingId]);

  return { listItems, showList, title };
};

export default useListTracker;
