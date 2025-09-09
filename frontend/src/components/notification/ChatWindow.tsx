import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Paper,
  TextField,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Sync as SyncIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Description as DocumentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { 
  getMessagesByOrderId, 
  sendMessage, 
  socketService, 
  Message,
  MessageRequest,
  MessageUpdate,
  MessageStatusUpdate,
  updateMessageInArray,
  updateMessageStatus,
  isOptimisticMessage
} from '../../services/messageService';

export interface Customer {
  order_id: number;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
  status: 'online' | 'offline' | 'away' | 'busy';
  avatar?: string;
  lastActive?: string;
  // Additional optional properties for backward compatibility
  phone?: string;
  order_number?: string;
  timestamp?: string;
  message_type?: string;
}

interface ChatWindowProps {
  customer: Customer;
  orderId: number;
}

// Simple media display component
const MediaDisplay: React.FC<{ message: Message }> = ({ message }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Get Twilio authenticated URL
  const getAuthenticatedUrl = (url: string) => {
    if (!url || !url.includes('api.twilio.com')) return url;
    
    const twilioSid = process.env.REACT_APP_TWILIO_SID;
    const twilioToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
    
    if (!twilioSid || !twilioToken) {
      console.warn('Twilio credentials not found in environment');
      return url;
    }

    // Add basic auth to URL
    const urlObj = new URL(url);
    urlObj.username = twilioSid;
    urlObj.password = twilioToken;
    return urlObj.toString();
  };

  const getMediaIcon = (type: string) => {
    if (type?.includes('image')) return <ImageIcon />;
    if (type?.includes('video')) return <VideoIcon />;
    if (type?.includes('audio')) return <AudioIcon />;
    return <DocumentIcon />;
  };

  // For images, show thumbnail
  if (message.fileType?.startsWith('image/') && message.fileUrl && !imageError) {
    const authUrl = getAuthenticatedUrl(message.fileUrl);
    
    return (
      <>
        <Box 
          sx={{ 
            cursor: 'pointer',
            borderRadius: 1,
            overflow: 'hidden',
            maxWidth: 200,
            maxHeight: 200,
            display: 'inline-block'
          }}
          onClick={() => setShowFullImage(true)}
        >
          <img
            src={authUrl}
            alt={message.fileName || 'Image'}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 200,
              objectFit: 'cover',
              display: 'block'
            }}
            onError={() => setImageError(true)}
          />
        </Box>
        
        {/* Full image dialog */}
        <Dialog open={showFullImage} onClose={() => setShowFullImage(false)} maxWidth="lg">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{message.fileName || 'Image'}</Typography>
            <IconButton onClick={() => setShowFullImage(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <img
              src={authUrl}
              alt={message.fileName || 'Image'}
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // For other files or failed images, show file info
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        p: 2, 
        bgcolor: 'rgba(0,0,0,0.1)', 
        borderRadius: 1,
        minWidth: 200,
        cursor: message.fileUrl ? 'pointer' : 'default'
      }}
      onClick={() => {
        if (message.fileUrl) {
          window.open(getAuthenticatedUrl(message.fileUrl), '_blank');
        }
      }}
    >
      {getMediaIcon(message.fileType || message.type)}
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {message.fileName || `${message.type} file`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {message.fileType || 'Click to open'}
        </Typography>
      </Box>
    </Box>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ customer, orderId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    
    getMessagesByOrderId(orderId)
      .then((fetchedMessages) => {
        setMessages(fetchedMessages);
        console.log(`Loaded ${fetchedMessages.length} messages for order ${orderId}`);
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setMessages([]);
        setError('Failed to load messages');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  // WebSocket setup
  useEffect(() => {
    if (!orderId) return;
    
    socketService.connect();
    socketService.joinOrder(orderId);

    const handleConnect = () => {
      setConnected(true);
      console.log('Socket connected for order:', orderId);
    };
    
    const handleDisconnect = () => {
      setConnected(false);
      console.log('Socket disconnected for order:', orderId);
    };
    
    const handleNewMessage = (msg: Message) => {
      console.log('New message received:', msg);
      setMessages(prev => {
        const existing = prev.find(m => m.id === msg.id);
        if (existing) return prev;
        return [...prev, msg];
      });
    };

    const handleMessageUpdated = (update: MessageUpdate) => {
      console.log('Message updated:', update);
      setMessages(prev => updateMessageInArray(prev, update.message, update.tempId));
    };

    const handleMessageStatusUpdated = (update: MessageStatusUpdate) => {
      console.log('Status update received:', update);
      setMessages(prev => updateMessageStatus(prev, update.messageId, update.update));
    };

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageUpdated(handleMessageUpdated);
    socketService.onMessageStatusUpdated(handleMessageStatusUpdated);

    if (socketService.isConnected()) {
      setConnected(true);
    }

    return () => {
      socketService.leaveOrder(orderId);
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageUpdated(handleMessageUpdated);
      socketService.offMessageStatusUpdated(handleMessageStatusUpdated);
    };
  }, [orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const getRandomColor = (name: string) => ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#00796b'][name.length % 6];

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sending':
        return {
          color: '#ff9800',
          bg: '#fff3e0',
          text: '#e65100',
          icon: <SyncIcon sx={{ fontSize: 14, animation: 'spin 1s linear infinite' }} />,
          label: 'Sending...'
        };
      case 'pending':
        return {
          color: '#ff9800',
          bg: '#fff3e0',
          text: '#e65100',
          icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
          label: 'Pending...'
        };
      case 'sent':
        return {
          color: '#2196f3',
          bg: '#e3f2fd',
          text: '#0d47a1',
          icon: <DoneIcon sx={{ fontSize: 14 }} />,
          label: 'Sent'
        };
      case 'delivered':
        return {
          color: '#4caf50',
          bg: '#e8f5e8',
          text: '#2e7d32',
          icon: <DoneAllIcon sx={{ fontSize: 14 }} />,
          label: 'Delivered'
        };
      case 'read':
        return {
          color: '#4caf50',
          bg: '#e8f5e8',
          text: '#2e7d32',
          icon: <DoneAllIcon sx={{ fontSize: 14, color: '#4caf50' }} />,
          label: 'Read'
        };
      case 'failed':
        return {
          color: '#f44336',
          bg: '#ffebee',
          text: '#c62828',
          icon: <ErrorIcon sx={{ fontSize: 14 }} />,
          label: 'Failed'
        };
      default:
        return {
          color: '#9e9e9e',
          bg: '#f5f5f5',
          text: '#616161',
          icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
          label: 'Pending'
        };
    }
  };

  const isMyMessage = (msg: Message) => {
    return msg.direction === 'outbound' || msg.sender === 'You' || msg.sender.startsWith('You:');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files (JPEG, PNG, GIF, WebP) are allowed');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || !connected) return;
    
    const content = selectedFile ? `[Image: ${selectedFile.name}]` : newMessage.trim();
    const messageType = selectedFile ? 'file' : 'text';
    
    setNewMessage('');
    setSelectedFile(null);
    setSending(true);
    setError(null);

    try {
      const messageData: MessageRequest = {
        sender: 'admin',
        content,
        type: messageType,
        phone_number: Number(customer.phone?.replace(/\D/g, '') || 0),
        ...(selectedFile && { fileName: selectedFile.name }),
      };

      console.log('Sending message:', messageData);
      const result = await sendMessage(orderId, messageData);

      if (result.success) {
        console.log('Message sent successfully');
        setSuccessMessage('Message sent successfully!');
      } else {
        console.error('Send failed:', result.error);
        setError(result.error || 'Failed to send message');
        if (!selectedFile) setNewMessage(content);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
      if (!selectedFile) setNewMessage(content);
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatSender = (msg: Message) => {
    if (isMyMessage(msg)) {
      return 'You';
    }
    return customer.name;
  };

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading messages...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: getRandomColor(customer.name), width: 32, height: 32, mr: 2 }}>
            {getInitials(customer.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.phone} • Order: {customer.order_id}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: connected ? 'success.main' : 'error.main', 
            mr: 1 
          }} />
          <Typography variant="caption" color={connected ? 'success.main' : 'error.main'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
        {messages.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No messages yet. Start a conversation with {customer.name}!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map(msg => {
              const myMsg = isMyMessage(msg);
              const config = getStatusConfig(msg.delivery_status);
              const senderName = formatSender(msg);
              const isOptimistic = isOptimisticMessage(msg);
              const isMediaMessage = msg.message_type === 'file' || msg.type !== 'text';
              
              return (
                <Box 
                  key={msg.id} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: myMsg ? 'row-reverse' : 'row', 
                    alignItems: 'flex-start', 
                    gap: 1,
                    opacity: isOptimistic ? 0.8 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <Avatar sx={{ 
                    bgcolor: getRandomColor(senderName), 
                    width: 24, 
                    height: 24, 
                    fontSize: '0.7rem' 
                  }}>
                    {getInitials(senderName)}
                  </Avatar>
                  <Box sx={{ maxWidth: '70%' }}>
                    <Paper sx={{
                      p: 1.5, 
                      bgcolor: myMsg ? 'primary.main' : 'grey.100', 
                      color: myMsg ? 'white' : 'text.primary', 
                      borderRadius: 2,
                      ...(myMsg && msg.delivery_status ? { 
                        borderLeft: `4px solid ${config.color}` 
                      } : {}),
                      ...(isOptimistic ? {
                        border: '1px dashed rgba(0,0,0,0.2)'
                      } : {})
                    }}>
                      {/* Text content */}
                      {msg.content && msg.content !== `[${msg.type}]` && !msg.content.startsWith('[Image:') && (
                        <Typography variant="body2" sx={{ mb: isMediaMessage ? 1 : 0 }}>
                          {msg.content}
                        </Typography>
                      )}
                      
                      {/* Media content */}
                      {(isMediaMessage || msg.fileUrl) && (
                        <MediaDisplay message={msg} />
                      )}
                    </Paper>
                    
                    {/* Message Info */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mt: 0.5, 
                      flexDirection: myMsg ? 'row-reverse' : 'row' 
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        {senderName} • {msg.timestamp}
                      </Typography>
                      {myMsg && msg.delivery_status && (
                        <Chip 
                          size="small" 
                          icon={config.icon} 
                          label={config.label} 
                          sx={{
                            height: 20, 
                            fontSize: '0.65rem', 
                            fontWeight: 500, 
                            color: config.text,
                            bgcolor: config.bg, 
                            border: `1px solid ${config.color}`, 
                            '& .MuiChip-icon': { color: config.color, ml: 0.5 }
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Selected file preview */}
      {selectedFile && (
        <Box sx={{ p: 1, bgcolor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ImageIcon color="primary" />
              <Typography variant="body2">{selectedFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedFile(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        bgcolor: 'background.paper', 
        borderTop: 1, 
        borderColor: 'divider' 
      }}>
        <Input
          type="file"
          inputRef={fileInputRef}
          onChange={handleFileSelect}
          inputProps={{ accept: 'image/*' }}
          sx={{ display: 'none' }}
        />
        <IconButton 
          disabled={!connected}
          onClick={() => fileInputRef.current?.click()}
        >
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder={connected ? `Type a message to ${customer.name}...` : 'Connecting...'}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || !connected}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || sending || !connected}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            '&:hover': { bgcolor: 'primary.dark' }, 
            '&:disabled': { bgcolor: 'grey.300', color: 'grey.500' } 
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Error/Success Snackbars */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={3000} 
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default ChatWindow;