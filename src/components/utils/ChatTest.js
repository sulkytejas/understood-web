import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { styled } from '@mui/system';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  Divider,
  Container,
  Alert,
  Card,
  CardContent,
  CardActions,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Styled Components
const ChatContainer = styled(Container)`
  display: flex;
  height: 100vh;
  padding: 24px;
  gap: 24px;
`;

const ChatPanel = styled(Paper)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow: hidden;
`;

const ChatHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const MessagesContainer = styled(Box)`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
`;

const MessageRow = styled(Box)`
  display: flex;
  margin-bottom: 12px;
  justify-content: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled(Box)`
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 18px;
  background-color: ${(props) => (props.isOwn ? '#1976d2' : '#e0e0e0')};
  color: ${(props) => (props.isOwn ? 'white' : 'rgba(0, 0, 0, 0.87)')};
  word-break: break-word;
`;

const MessageTime = styled(Typography)`
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  text-align: ${(props) => (props.isOwn ? 'right' : 'left')};
`;

const InputContainer = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ConnectionDot = styled(CircleIcon)`
  font-size: 12px;
  color: ${(props) => (props.connected ? '#4caf50' : '#f44336')};
`;

const RequestCard = styled(Card)`
  margin-bottom: 16px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
`;

const ChatTest = () => {
  // State
  const [user1Messages, setUser1Messages] = useState([]);
  const [user2Messages, setUser2Messages] = useState([]);
  const [user1Input, setUser1Input] = useState('');
  const [user2Input, setUser2Input] = useState('');
  const [connected, setConnected] = useState({ user1: false, user2: false });
  const [chatPermissions, setChatPermissions] = useState({
    user1CanChat: false,
    user2CanChat: false,
  });
  const [pendingRequests, setPendingRequests] = useState({
    user1: null,
    user2: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Refs
  const user1SocketRef = useRef(null);
  const user2SocketRef = useRef(null);
  const user1MessagesEndRef = useRef(null);
  const user2MessagesEndRef = useRef(null);

  // Fixed User IDs for testing
  const USER1_ID = 'testUser1';
  const USER2_ID = 'testUser2';

  // Auto scroll to bottom
  const scrollToBottom = (userNum) => {
    if (userNum === 1) {
      user1MessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      user2MessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom(1);
  }, [user1Messages]);

  useEffect(() => {
    scrollToBottom(2);
  }, [user2Messages]);

  useEffect(() => {
    // Initialize both socket connections
    user1SocketRef.current = io(process.env.REACT_APP_API_URL);
    user2SocketRef.current = io(process.env.REACT_APP_API_URL);

    // Setup User 1
    user1SocketRef.current.on('connect', () => {
      console.log('User 1 connected');
      user1SocketRef.current.emit('registerUid', USER1_ID);
      setConnected((prev) => ({ ...prev, user1: true }));
    });

    // Setup User 2
    user2SocketRef.current.on('connect', () => {
      console.log('User 2 connected');
      user2SocketRef.current.emit('registerUid', USER2_ID);
      setConnected((prev) => ({ ...prev, user2: true }));
    });

    // User 1 listeners
    user1SocketRef.current.on('newMessage', (message) => {
      console.log('User1 received:', message);
      setUser1Messages((prev) => [...prev, message]);
    });

    user1SocketRef.current.on('chatRequestResponse', (data) => {
      console.log('User1 received response:', data);
      if (data.accepted) {
        setChatPermissions((prev) => ({ ...prev, user1CanChat: true }));
        setSnackbar({
          open: true,
          message: 'Chat request accepted! You can now send messages.',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Chat request was rejected.',
          severity: 'error',
        });
      }
    });

    user1SocketRef.current.on('messagesRead', ({ readBy }) => {
      console.log(readBy);
      setSnackbar({
        open: true,
        message: 'Messages marked as read',
        severity: 'info',
      });
    });

    // User 2 listeners
    user2SocketRef.current.on('newMessage', (message) => {
      console.log('User2 received:', message);
      setUser2Messages((prev) => [...prev, message]);
    });

    user2SocketRef.current.on('newChatRequest', (data) => {
      console.log('User2 received chat request:', data);
      setPendingRequests((prev) => ({ ...prev, user2: data }));
      setSnackbar({
        open: true,
        message: 'New chat request received!',
        severity: 'info',
      });
    });

    user2SocketRef.current.on('messagesRead', ({ readBy }) => {
      console.log(readBy);
      setSnackbar({
        open: true,
        message: 'Messages marked as read',
        severity: 'info',
      });
    });

    // Disconnect handlers
    user1SocketRef.current.on('disconnect', () => {
      setConnected((prev) => ({ ...prev, user1: false }));
    });

    user2SocketRef.current.on('disconnect', () => {
      setConnected((prev) => ({ ...prev, user2: false }));
    });

    // Cleanup
    return () => {
      user1SocketRef.current?.disconnect();
      user2SocketRef.current?.disconnect();
    };
  }, []);

  // Chat Request Functions
  const sendChatRequestFromUser1 = () => {
    user1SocketRef.current.emit(
      'sendChatRequest',
      { recipientId: USER2_ID },
      (response) => {
        console.log('Chat request sent:', response);
        if (response.success) {
          setSnackbar({
            open: true,
            message: 'Chat request sent successfully!',
            severity: 'success',
          });
        } else if (response.status === 'accepted') {
          setChatPermissions((prev) => ({ ...prev, user1CanChat: true }));
          setSnackbar({
            open: true,
            message: 'You are already connected!',
            severity: 'info',
          });
        } else {
          setSnackbar({
            open: true,
            message: response.error || 'Failed to send request',
            severity: 'error',
          });
        }
      },
    );
  };

  const respondToRequestAsUser2 = (accept) => {
    user2SocketRef.current.emit(
      'respondToChatRequest',
      { senderId: USER1_ID, accept },
      (response) => {
        console.log('Request response:', response);
        if (response.success) {
          if (accept) {
            setChatPermissions((prev) => ({ ...prev, user2CanChat: true }));
            setSnackbar({
              open: true,
              message: 'Chat request accepted!',
              severity: 'success',
            });
          }
          setPendingRequests((prev) => ({ ...prev, user2: null }));
        }
      },
    );
  };

  // Open Chat Functions
  const openChatAsUser1 = () => {
    user1SocketRef.current.emit(
      'openChat',
      { recipientId: USER2_ID },
      (response) => {
        console.log('User1 open chat:', response);
        if (response.success) {
          if (response.messages) {
            setUser1Messages(response.messages.reverse());
          }
          setChatPermissions((prev) => ({ ...prev, user1CanChat: true }));
        } else if (response.requiresRequest) {
          setSnackbar({
            open: true,
            message: 'You need to send a chat request first!',
            severity: 'warning',
          });
        }
      },
    );
  };

  const openChatAsUser2 = () => {
    user2SocketRef.current.emit(
      'openChat',
      { recipientId: USER1_ID },
      (response) => {
        console.log('User2 open chat:', response);
        if (response.success) {
          if (response.messages) {
            setUser2Messages(response.messages.reverse());
          }
          setChatPermissions((prev) => ({ ...prev, user2CanChat: true }));
        } else if (response.requiresRequest) {
          setSnackbar({
            open: true,
            message: 'You need to accept the chat request first!',
            severity: 'warning',
          });
        }
      },
    );
  };

  // Message Functions
  const sendMessageAsUser1 = () => {
    if (!user1Input.trim()) return;

    const messageData = {
      recipientId: USER2_ID,
      content: user1Input,
    };

    user1SocketRef.current.emit('sendMessage', messageData, (response) => {
      console.log('User1 send response:', response);
      if (response.success) {
        setUser1Messages((prev) => [
          ...prev,
          {
            content: user1Input,
            senderId: USER1_ID,
            recipientId: USER2_ID,
            timestamp: new Date(),
            _id: response.messageId,
          },
        ]);
      } else {
        setSnackbar({
          open: true,
          message: response.error || 'Failed to send message',
          severity: 'error',
        });
      }
    });

    setUser1Input('');
  };

  const sendMessageAsUser2 = () => {
    if (!user2Input.trim()) return;

    const messageData = {
      recipientId: USER1_ID,
      content: user2Input,
    };

    user2SocketRef.current.emit('sendMessage', messageData, (response) => {
      console.log('User2 send response:', response);
      if (response.success) {
        setUser2Messages((prev) => [
          ...prev,
          {
            content: user2Input,
            senderId: USER2_ID,
            recipientId: USER1_ID,
            timestamp: new Date(),
            _id: response.messageId,
          },
        ]);
      } else {
        setSnackbar({
          open: true,
          message: response.error || 'Failed to send message',
          severity: 'error',
        });
      }
    });

    setUser2Input('');
  };

  const markAsReadUser1 = () => {
    const conversationId = [USER1_ID, USER2_ID].sort().join('_');
    user1SocketRef.current.emit(
      'markAsRead',
      { conversationId },
      (response) => {
        console.log('Mark as read response:', response);
      },
    );
  };

  const markAsReadUser2 = () => {
    const conversationId = [USER1_ID, USER2_ID].sort().join('_');
    user2SocketRef.current.emit(
      'markAsRead',
      { conversationId },
      (response) => {
        console.log('Mark as read response:', response);
      },
    );
  };

  const renderMessages = (messages, currentUserId) => {
    return messages.map((msg, index) => (
      <Box key={msg._id || index}>
        <MessageRow isOwn={msg.senderId === currentUserId}>
          <Box>
            <MessageBubble isOwn={msg.senderId === currentUserId}>
              <Typography variant="body1">{msg.content}</Typography>
            </MessageBubble>
            <MessageTime
              isOwn={msg.senderId === currentUserId}
              variant="caption"
            >
              {msg.senderId === currentUserId ? 'You' : 'Other'} •{' '}
              {new Date(msg.timestamp).toLocaleTimeString()}
            </MessageTime>
          </Box>
        </MessageRow>
      </Box>
    ));
  };

  return (
    <ChatContainer maxWidth={false}>
      {/* User 1 Chat Panel */}
      <ChatPanel elevation={3}>
        <ChatHeader>
          <Typography variant="h6" color="primary">
            User 1
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <ConnectionDot connected={connected.user1 ? 1 : 0} />
            <Chip
              label={USER1_ID}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </ChatHeader>

        <Divider />

        {/* Action Buttons */}
        <Box my={2} display="flex" gap={1}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={sendChatRequestFromUser1}
            disabled={!connected.user1 || chatPermissions.user1CanChat}
          >
            Send Request
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={openChatAsUser1}
            disabled={!connected.user1}
          >
            Open Chat
          </Button>
        </Box>

        {!chatPermissions.user1CanChat && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Send a chat request to start messaging
          </Alert>
        )}

        <MessagesContainer>
          {renderMessages(user1Messages, USER1_ID)}
          <div ref={user1MessagesEndRef} />
        </MessagesContainer>

        <InputContainer>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={
              chatPermissions.user1CanChat
                ? 'Type a message...'
                : 'Send a chat request first...'
            }
            value={user1Input}
            onChange={(e) => setUser1Input(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' &&
              chatPermissions.user1CanChat &&
              sendMessageAsUser1()
            }
            disabled={!chatPermissions.user1CanChat}
          />
          <IconButton
            color="primary"
            onClick={sendMessageAsUser1}
            disabled={!connected.user1 || !chatPermissions.user1CanChat}
          >
            <SendIcon />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={markAsReadUser1}
            disabled={!chatPermissions.user1CanChat}
          >
            Read
          </Button>
        </InputContainer>
      </ChatPanel>

      {/* User 2 Chat Panel */}
      <ChatPanel elevation={3}>
        <ChatHeader>
          <Typography variant="h6" color="success.main">
            User 2
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <ConnectionDot connected={connected.user2 ? 1 : 0} />
            <Chip
              label={USER2_ID}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
        </ChatHeader>

        <Divider />

        {/* Pending Request Card */}
        {pendingRequests.user2 && (
          <RequestCard>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                New chat request from {pendingRequests.user2.senderId}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="success"
                startIcon={<CheckIcon />}
                onClick={() => respondToRequestAsUser2(true)}
              >
                Accept
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => respondToRequestAsUser2(false)}
              >
                Reject
              </Button>
            </CardActions>
          </RequestCard>
        )}

        {/* Action Buttons */}
        <Box my={2}>
          <Button
            variant="outlined"
            color="success"
            size="small"
            onClick={openChatAsUser2}
            disabled={!connected.user2}
          >
            Open Chat
          </Button>
        </Box>

        {!chatPermissions.user2CanChat && !pendingRequests.user2 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Waiting for chat request...
          </Alert>
        )}

        <MessagesContainer>
          {renderMessages(user2Messages, USER2_ID)}
          <div ref={user2MessagesEndRef} />
        </MessagesContainer>

        <InputContainer>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={
              chatPermissions.user2CanChat
                ? 'Type a message...'
                : 'Accept request first...'
            }
            value={user2Input}
            onChange={(e) => setUser2Input(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' &&
              chatPermissions.user2CanChat &&
              sendMessageAsUser2()
            }
            disabled={!chatPermissions.user2CanChat}
          />
          <IconButton
            color="success"
            onClick={sendMessageAsUser2}
            disabled={!connected.user2 || !chatPermissions.user2CanChat}
          >
            <SendIcon />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={markAsReadUser2}
            disabled={!chatPermissions.user2CanChat}
          >
            Read
          </Button>
        </InputContainer>
      </ChatPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default ChatTest;
