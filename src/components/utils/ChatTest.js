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
  CircularProgress,
  Link,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
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

const FileMessageBubble = styled(MessageBubble)`
  padding: 8px;
  cursor: pointer;
`;

const MessageImage = styled('img')`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  display: block;
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
  align-items: flex-end;
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

const FilePreview = styled(Box)`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
`;

const HiddenFileInput = styled('input')`
  display: none;
`;

const NotificationItem = styled(ListItem)`
  &:hover {
    background-color: #f5f5f5;
  }
  cursor: pointer;
`;

const ChatTest = () => {
  // State
  const [user1Messages, setUser1Messages] = useState([]);
  const [user2Messages, setUser2Messages] = useState([]);
  const [user1Input, setUser1Input] = useState('');
  const [user2Input, setUser2Input] = useState('');
  const [user1File, setUser1File] = useState(null);
  const [user2File, setUser2File] = useState(null);
  const [user1Uploading, setUser1Uploading] = useState(false);
  const [user2Uploading, setUser2Uploading] = useState(false);
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

  // Notification state
  const [user1Notifications, setUser1Notifications] = useState([]);
  const [user2Notifications, setUser2Notifications] = useState([]);
  const [user1NotificationsOpen, setUser1NotificationsOpen] = useState(false);
  const [user2NotificationsOpen, setUser2NotificationsOpen] = useState(false);
  const [user1UnreadCount, setUser1UnreadCount] = useState(0);
  const [user2UnreadCount, setUser2UnreadCount] = useState(0);

  // Refs
  const user1SocketRef = useRef(null);
  const user2SocketRef = useRef(null);
  const user1MessagesEndRef = useRef(null);
  const user2MessagesEndRef = useRef(null);
  const user1FileInputRef = useRef(null);
  const user2FileInputRef = useRef(null);

  // Fixed User IDs for testing
  const USER1_ID = 'testUser1';
  const USER2_ID = 'testUser2';

  // Constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

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
    user1SocketRef.current = io(
      process.env.REACT_APP_API_URL || 'http://localhost:3000',
    );
    user2SocketRef.current = io(
      process.env.REACT_APP_API_URL || 'http://localhost:3000',
    );

    // Setup User 1
    user1SocketRef.current.on('connect', () => {
      console.log('User 1 connected');
      user1SocketRef.current.emit('registerUid', USER1_ID);
      setConnected((prev) => ({ ...prev, user1: true }));

      // Get notifications on connect
      user1SocketRef.current.emit('getNotifications', (response) => {
        if (response.success) {
          setUser1Notifications(response.notifications || []);
          const unreadCount =
            response.notifications?.filter((n) => !n.isRead).length || 0;
          setUser1UnreadCount(unreadCount);
        }
      });
    });

    // Setup User 2
    user2SocketRef.current.on('connect', () => {
      console.log('User 2 connected');
      user2SocketRef.current.emit('registerUid', USER2_ID);
      setConnected((prev) => ({ ...prev, user2: true }));

      // Get notifications on connect
      user2SocketRef.current.emit('getNotifications', (response) => {
        if (response.success) {
          setUser2Notifications(response.notifications || []);
          const unreadCount =
            response.notifications?.filter((n) => !n.isRead).length || 0;
          setUser2UnreadCount(unreadCount);
        }
      });
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

      // Add to notifications
      const newNotification = {
        _id: Date.now().toString(),
        type: 'chat_request',
        content: 'sent you a chat request',
        senderId: data.senderId,
        createdAt: new Date(),
        isRead: false,
        relatedId: data.requestId,
      };
      setUser2Notifications((prev) => [newNotification, ...prev]);
      setUser2UnreadCount((prev) => prev + 1);
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

  // Function to open notifications
  const openNotifications = (userNum) => {
    const socket =
      userNum === 1 ? user1SocketRef.current : user2SocketRef.current;
    const setOpen =
      userNum === 1 ? setUser1NotificationsOpen : setUser2NotificationsOpen;
    const notifications =
      userNum === 1 ? user1Notifications : user2Notifications;

    setOpen(true);

    // Mark notifications as read
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
    if (unreadIds.length > 0) {
      socket.emit(
        'markNotificationsRead',
        { notificationIds: unreadIds },
        (response) => {
          if (response.success) {
            if (userNum === 1) {
              setUser1Notifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true })),
              );
              setUser1UnreadCount(0);
            } else {
              setUser2Notifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true })),
              );
              setUser2UnreadCount(0);
            }
          }
        },
      );
    }
  };

  // Function to handle notification click
  const handleNotificationClick = (notification, userNum) => {
    if (notification.type === 'chat_request') {
      // Close notifications dialog
      if (userNum === 1) {
        setUser1NotificationsOpen(false);
      } else {
        setUser2NotificationsOpen(false);
      }

      // Show the request in the pending requests
      if (userNum === 2) {
        setPendingRequests((prev) => ({
          ...prev,
          user2: {
            senderId: notification.senderId,
            requestId: notification.relatedId,
          },
        }));
      }
    }
  };

  // Notification Dialog Component
  const NotificationDialog = ({ open, onClose, notifications, userNum }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notifications</DialogTitle>
      <DialogContent>
        {notifications.length === 0 ? (
          <Typography color="textSecondary" align="center" py={2}>
            No notifications
          </Typography>
        ) : (
          <List>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification, userNum)}
                sx={{
                  backgroundColor: notification.isRead
                    ? 'transparent'
                    : '#f0f7ff',
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${notification.senderId} ${notification.content}`}
                  secondary={new Date(notification.createdAt).toLocaleString()}
                />
              </NotificationItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );

  // File handling functions
  const handleFileSelect = (event, userNum) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Invalid file type. Only images and PDFs are allowed.',
        severity: 'error',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({
        open: true,
        message: 'File too large. Maximum size is 10MB.',
        severity: 'error',
      });
      return;
    }

    if (userNum === 1) {
      setUser1File(file);
    } else {
      setUser2File(file);
    }
  };

  const removeFile = (userNum) => {
    if (userNum === 1) {
      setUser1File(null);
      if (user1FileInputRef.current) {
        user1FileInputRef.current.value = '';
      }
    } else {
      setUser2File(null);
      if (user2FileInputRef.current) {
        user2FileInputRef.current.value = '';
      }
    }
  };

  const uploadFileAsUser = async (userNum) => {
    const file = userNum === 1 ? user1File : user2File;
    const socket =
      userNum === 1 ? user1SocketRef.current : user2SocketRef.current;
    const recipientId = userNum === 1 ? USER2_ID : USER1_ID;
    const setUploading = userNum === 1 ? setUser1Uploading : setUser2Uploading;
    const setFile = userNum === 1 ? setUser1File : setUser2File;
    const setMessages = userNum === 1 ? setUser1Messages : setUser2Messages;
    const senderId = userNum === 1 ? USER1_ID : USER2_ID;

    if (!file) return;

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];

        socket.emit(
          'uploadFile',
          {
            fileData: base64Data,
            mimeType: file.type,
            originalName: file.name,
            recipientId,
          },
          (response) => {
            setUploading(false);

            if (response.success) {
              // Add file message to sender's UI
              setMessages((prev) => [
                ...prev,
                {
                  _id: response.messageId,
                  content: {
                    type: 'file',
                    text: file.name,
                    fileUrl: response.fileUrl,
                    mimeType: file.type,
                    fileSize: file.size,
                  },
                  senderId: senderId,
                  recipientId: recipientId,
                  timestamp: new Date(),
                  messageType: 'file',
                },
              ]);

              setFile(null);
              removeFile(userNum);

              setSnackbar({
                open: true,
                message: 'File sent successfully!',
                severity: 'success',
              });
            } else {
              setSnackbar({
                open: true,
                message: response.error || 'Failed to upload file',
                severity: 'error',
              });
            }
          },
        );
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setUploading(false);
      setSnackbar({
        open: true,
        message: 'Failed to upload file',
        severity: 'error',
      });
    }
  };

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
    if (!user1Input.trim() && !user1File) return;

    if (user1File) {
      uploadFileAsUser(1);
      return;
    }

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
    if (!user2Input.trim() && !user2File) return;

    if (user2File) {
      uploadFileAsUser(2);
      return;
    }

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

  const renderMessage = (msg, currentUserId) => {
    // Check if this is a file message
    if (
      msg.messageType === 'file' ||
      (msg.content &&
        typeof msg.content === 'object' &&
        msg.content.type === 'file')
    ) {
      const content = msg.content;
      const isOwn = msg.senderId === currentUserId;

      if (content.mimeType && content.mimeType.startsWith('image/')) {
        // Render image
        return (
          <MessageRow key={msg._id} isOwn={isOwn}>
            <Box>
              <FileMessageBubble isOwn={isOwn}>
                <MessageImage
                  src={content.fileUrl}
                  alt={content.text}
                  onClick={() => window.open(content.fileUrl, '_blank')}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {content.text}
                </Typography>
              </FileMessageBubble>
              <MessageTime isOwn={isOwn} variant="caption">
                {isOwn ? 'You' : 'Other'} •{' '}
                {new Date(msg.timestamp).toLocaleTimeString()}
              </MessageTime>
            </Box>
          </MessageRow>
        );
      } else if (content.mimeType === 'application/pdf') {
        // Render PDF
        return (
          <MessageRow key={msg._id} isOwn={isOwn}>
            <Box>
              <FileMessageBubble isOwn={isOwn}>
                <Box display="flex" alignItems="center" gap={1}>
                  <FileIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Link
                      href={content.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: isOwn ? 'white' : 'primary.main',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {content.text}
                    </Link>
                    <Typography variant="caption" display="block">
                      PDF Document
                    </Typography>
                  </Box>
                </Box>
              </FileMessageBubble>
              <MessageTime isOwn={isOwn} variant="caption">
                {isOwn ? 'You' : 'Other'} •{' '}
                {new Date(msg.timestamp).toLocaleTimeString()}
              </MessageTime>
            </Box>
          </MessageRow>
        );
      }
    }

    // Regular text message
    return (
      <MessageRow key={msg._id} isOwn={msg.senderId === currentUserId}>
        <Box>
          <MessageBubble isOwn={msg.senderId === currentUserId}>
            <Typography variant="body1">{msg.content}</Typography>
          </MessageBubble>
          <MessageTime isOwn={msg.senderId === currentUserId} variant="caption">
            {msg.senderId === currentUserId ? 'You' : 'Other'} •{' '}
            {new Date(msg.timestamp).toLocaleTimeString()}
          </MessageTime>
        </Box>
      </MessageRow>
    );
  };

  const renderMessages = (messages, currentUserId) => {
    return messages.map((msg) => renderMessage(msg, currentUserId));
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
            <IconButton onClick={() => openNotifications(1)}>
              <Badge badgeContent={user1UnreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
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

        {/* File Preview */}
        {user1File && (
          <FilePreview>
            {user1File.type.startsWith('image/') ? (
              <ImageIcon sx={{ mr: 1 }} />
            ) : (
              <FileIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" sx={{ flex: 1 }}>
              {user1File.name}
            </Typography>
            <IconButton size="small" onClick={() => removeFile(1)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </FilePreview>
        )}

        <InputContainer>
          <HiddenFileInput
            ref={user1FileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect(e, 1)}
            id="user1-file-input"
          />
          <label htmlFor="user1-file-input">
            <IconButton
              color="primary"
              component="span"
              disabled={!chatPermissions.user1CanChat || user1Uploading}
            >
              <AttachFileIcon />
            </IconButton>
          </label>
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
              !user1Uploading &&
              sendMessageAsUser1()
            }
            disabled={!chatPermissions.user1CanChat || user1Uploading}
          />
          <IconButton
            color="primary"
            onClick={sendMessageAsUser1}
            disabled={
              !connected.user1 ||
              !chatPermissions.user1CanChat ||
              user1Uploading ||
              (!user1Input.trim() && !user1File)
            }
          >
            {user1Uploading ? <CircularProgress size={24} /> : <SendIcon />}
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
            <IconButton onClick={() => openNotifications(2)}>
              <Badge badgeContent={user2UnreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
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

        {/* File Preview */}
        {user2File && (
          <FilePreview>
            {user2File.type.startsWith('image/') ? (
              <ImageIcon sx={{ mr: 1 }} />
            ) : (
              <FileIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" sx={{ flex: 1 }}>
              {user2File.name}
            </Typography>
            <IconButton size="small" onClick={() => removeFile(2)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </FilePreview>
        )}

        <InputContainer>
          <HiddenFileInput
            ref={user2FileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect(e, 2)}
            id="user2-file-input"
          />
          <label htmlFor="user2-file-input">
            <IconButton
              color="success"
              component="span"
              disabled={!chatPermissions.user2CanChat || user2Uploading}
            >
              <AttachFileIcon />
            </IconButton>
          </label>
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
              !user2Uploading &&
              sendMessageAsUser2()
            }
            disabled={!chatPermissions.user2CanChat || user2Uploading}
          />
          <IconButton
            color="success"
            onClick={sendMessageAsUser2}
            disabled={
              !connected.user2 ||
              !chatPermissions.user2CanChat ||
              user2Uploading ||
              (!user2Input.trim() && !user2File)
            }
          >
            {user2Uploading ? <CircularProgress size={24} /> : <SendIcon />}
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

      {/* Notification Dialogs */}
      <NotificationDialog
        open={user1NotificationsOpen}
        onClose={() => setUser1NotificationsOpen(false)}
        notifications={user1Notifications}
        userNum={1}
      />

      <NotificationDialog
        open={user2NotificationsOpen}
        onClose={() => setUser2NotificationsOpen(false)}
        notifications={user2Notifications}
        userNum={2}
      />

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
