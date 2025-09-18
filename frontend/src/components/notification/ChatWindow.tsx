import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Avatar, IconButton, Paper, TextField,
  CircularProgress, Alert, Snackbar, Dialog, DialogContent, DialogTitle,
   Divider, Skeleton, Fade, Zoom, Backdrop, Slide
} from '@mui/material';
import {
  AttachFile, Send, Close, PhoneDisabled, Image, VideoFile,
  AudioFile, Description, Check, DoneAll, AccessTime,
  ErrorOutline, Circle
} from '@mui/icons-material';
import { 
  getMessagesByOrderId, sendMessage, socketService, uploadFile,
  updateMessageInArray, updateMessageStatus, isOptimisticMessage, validateFileForTwilio
} from '../../services/messageService';
import { Customer, ChatWindowProps, Message, MessageRequest, MessageUpdate, MessageStatusUpdate } from './shared/types';
import { getInitials, getAvatarColor } from './shared/utils';

// ==========================================
// INTERFACES
// ==========================================

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface GroupedMessage {
  date: string;
  messages: Message[];
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB');
};

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};

const groupMessagesByDate = (messages: Message[]): GroupedMessage[] => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const dateKey = new Date(message.timestamp).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups)
    .map(([date, messages]) => ({
      date,
      messages: messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// ==========================================
// STATUS ICON COMPONENT
// ==========================================

const MessageStatusIcon = ({ status }: { status?: string }) => {
  const iconStyle = { fontSize: 16, ml: 0.5 };
  
  switch(status?.toLowerCase()) {
    case 'sent':
      return <Check sx={{ ...iconStyle, color: '#8e8e93' }} />;
    case 'delivered':
      return <DoneAll sx={{ ...iconStyle, color: '#8e8e93' }} />;
    case 'read':
      return <DoneAll sx={{ ...iconStyle, color: '#34b7f1' }} />;
    case 'failed':
    case 'error':
      return <ErrorOutline sx={{ ...iconStyle, color: '#f44336' }} />;
    case 'pending':
    case 'sending':
      return <AccessTime sx={{ ...iconStyle, color: '#8e8e93' }} />;
    default:
      return <AccessTime sx={{ ...iconStyle, color: '#8e8e93' }} />;
  }
};

// ==========================================
// CONNECTION STATUS COMPONENT
// ==========================================

const ConnectionStatus = ({ connected }: { connected: boolean }) => {
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    if (connected) {
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowStatus(true);
    }
  }, [connected]);

  if (!showStatus && connected) return null;

  return (
    <Fade in={showStatus}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        bgcolor: connected ? '#25d366' : '#ffc107',
        borderRadius: 2,
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10
      }}>
        <Circle sx={{ fontSize: 8, color: 'white' }} />
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 500 }}>
          {connected ? 'Online' : 'Connecting...'}
        </Typography>
      </Box>
    </Fade>
  );
};

// ==========================================
// MEDIA DISPLAY COMPONENT
// ==========================================

const MediaDisplay = ({ message }: { message: Message }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [loading, setLoading] = useState(true);

  const getMediaIcon = (type?: string) => {
    const iconProps = { sx: { fontSize: 24, color: '#757575' } };
    if (type?.includes('image')) return <Image {...iconProps} />;
    if (type?.includes('video')) return <VideoFile {...iconProps} />;
    if (type?.includes('audio')) return <AudioFile {...iconProps} />;
    return <Description {...iconProps} />;
  };

  if (message.fileType?.startsWith('image/') && message.fileUrl && !imageError) {
    return (
      <>
        <Box sx={{ position: 'relative', cursor: 'pointer', borderRadius: 1, overflow: 'hidden', maxWidth: 200 }}>
          {loading && (
            <Skeleton variant="rectangular" width={200} height={150} animation="wave" />
          )}
          <img 
            src={message.fileUrl} 
            alt={message.fileName || 'Image'}
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: 200, 
              objectFit: 'cover',
              display: loading ? 'none' : 'block'
            }}
            onLoad={() => setLoading(false)}
            onError={() => setImageError(true)}
            onClick={() => setShowFullImage(true)}
          />
        </Box>
        
        <Dialog 
          open={showFullImage} 
          onClose={() => setShowFullImage(false)} 
          maxWidth="lg"
          TransitionComponent={Zoom}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{message.fileName || 'Image'}</Typography>
            <IconButton onClick={() => setShowFullImage(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <img 
              src={message.fileUrl} 
              alt={message.fileName || 'Image'}
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Paper 
      elevation={0}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5, 
        p: 1.5, 
        bgcolor: 'rgba(0,0,0,0.05)', 
        borderRadius: 1, 
        minWidth: 180,
        cursor: message.fileUrl ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': message.fileUrl ? { bgcolor: 'rgba(0,0,0,0.08)' } : {}
      }}
      onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
    >
      {getMediaIcon(message.fileType || message.type)}
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {message.fileName || `${message.type} file`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click to open
        </Typography>
      </Box>
    </Paper>
  );
};

// ==========================================
// MESSAGE SKELETON LOADER
// ==========================================

const MessageSkeleton = ({ isRight = false }: { isRight?: boolean }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: isRight ? 'row-reverse' : 'row', 
    alignItems: 'flex-end', 
    gap: 1, 
    mb: 2
  }}>
    <Skeleton variant="circular" width={32} height={32} />
    <Box sx={{ maxWidth: '70%' }}>
      <Skeleton 
        variant="rounded" 
        width={180 + Math.random() * 120} 
        height={60 + Math.random() * 40}
        sx={{ borderRadius: 2 }}
      />
    </Box>
  </Box>
);

// ==========================================
// MESSAGE ITEM COMPONENT
// ==========================================

const MessageItem = React.memo<{ 
  message: Message; 
  customer: Customer; 
  isMyMessage: boolean; 
}>(({ message, customer, isMyMessage }) => {
  const senderName = isMyMessage ? 'You' : customer.name;
  const isOptimistic = isOptimisticMessage(message);
  const isMediaMessage = message.message_type === 'file' || message.type !== 'text';

  return (
    <Fade in timeout={300}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMyMessage ? 'row-reverse' : 'row', 
        alignItems: 'flex-end', 
        gap: 1, 
        mb: 2,
        opacity: isOptimistic ? 0.7 : 1
      }}>
        <Avatar sx={{ 
          bgcolor: isMyMessage ? '#128c7e' : getAvatarColor(senderName), 
          width: 32, 
          height: 32, 
          fontSize: '0.85rem'
        }}>
          {getInitials(senderName)}
        </Avatar>
        
        <Box sx={{ maxWidth: '70%' }}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 1.5, 
              bgcolor: isMyMessage ? '#dcf8c6' : 'white', 
              borderRadius: isMyMessage ? '10px 10px 0 10px' : '10px 10px 10px 0',
              position: 'relative',
              ...(isOptimistic && { 
                opacity: 0.8
              })
            }}
          >
            {message.content && 
             !message.content.startsWith('[') && (
              <Typography variant="body2" sx={{ 
                mb: isMediaMessage ? 1 : 0, 
                wordBreak: 'break-word',
                color: '#303030'
              }}>
                {message.content}
              </Typography>
            )}
            
            {(isMediaMessage || message.fileUrl) && <MediaDisplay message={message} />}
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              gap: 0.3,
              mt: 0.5
            }}>
              <Typography variant="caption" sx={{ 
                color: '#8e8e93',
                fontSize: '0.68rem'
              }}>
                {formatTime(message.timestamp)}
              </Typography>
              {isMyMessage && <MessageStatusIcon status={message.delivery_status} />}
            </Box>
          </Paper>
          
          {/* Status text below message for sent messages */}
          {isMyMessage && message.delivery_status && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                textAlign: 'right',
                mt: 0.3,
                color: '#8e8e93',
                fontSize: '0.65rem',
                textTransform: 'capitalize'
              }}
            >
              {message.delivery_status}
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
});

// ==========================================
// MAIN COMPONENT
// ==========================================

const ChatWindow: React.FC<ChatWindowProps> = ({ customer, orderId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [connected, setConnected] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasValidPhone = useMemo(() => 
    customer.phone && customer.phone.replace(/\D/g, '') !== '', 
    [customer.phone]
  );

  const isInputDisabled = sending || uploading || !connected || !hasValidPhone;

  const isMyMessage = useCallback((msg: Message) => 
    msg.direction === 'outbound' || msg.sender === 'You' || msg.sender === 'admin', 
    []
  );

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileForTwilio(file);
    if (!validation.valid) {
      showSnackbar(validation.error || 'Invalid file', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    showSnackbar(`File selected: ${file.name}`, 'info');
  }, [showSnackbar]);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || isInputDisabled) return;
    
    setSending(true);

    try {
      let messageData: MessageRequest;
      
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        
        const uploadResult = await uploadFile(selectedFile, orderId.toString(), (progress) => {
          setUploadProgress(progress);
        });
        
        setUploading(false);
        
        if (!uploadResult.success) {
          showSnackbar(uploadResult.error || 'Failed to upload file', 'error');
          return;
        }
        
        messageData = {
          sender: 'admin',
          content: `Sent ${selectedFile.type.startsWith('image/') ? 'an image' : 'a file'}: ${selectedFile.name}`,
          type: 'file',
          phone_number: Number(customer.phone?.replace(/\D/g, '') || 0),
          fileName: selectedFile.name,
          fileUrl: uploadResult.fileUrl,
          fileType: selectedFile.type
        };
      } else {
        messageData = {
          sender: 'admin',
          content: newMessage.trim(),
          type: 'text',
          phone_number: Number(customer.phone?.replace(/\D/g, '') || 0),
        };
      }

      const result = await sendMessage(orderId, messageData);

      if (result.success) {
        showSnackbar(selectedFile ? 'File sent successfully!' : 'Message sent!', 'success');
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showSnackbar(result.error || 'Failed to send', 'error');
      }
    } catch (err) {
      showSnackbar('Failed to send', 'error');
    } finally {
      setSending(false);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [newMessage, selectedFile, isInputDisabled, orderId, customer.phone, showSnackbar]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Effects
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    
    getMessagesByOrderId(orderId)
      .then(setMessages)
      .catch(() => {
        setMessages([]);
        showSnackbar('Failed to load messages', 'error');
      })
      .finally(() => setLoading(false));
  }, [orderId, showSnackbar]);

  useEffect(() => {
    if (!orderId) return;
    
    socketService.connect();
    socketService.joinOrder(orderId);

    const handleConnect = () => {
      setConnected(true);
      showSnackbar('Connected to chat', 'success');
    };
    const handleDisconnect = () => {
      setConnected(false);
      showSnackbar('Connection lost. Reconnecting...', 'warning');
    };
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    };
    const handleMessageUpdated = (update: MessageUpdate) => {
      setMessages(prev => updateMessageInArray(prev, update.message, update.tempId));
    };
    const handleMessageStatusUpdated = (update: MessageStatusUpdate) => {
      setMessages(prev => updateMessageStatus(prev, update.messageId, update.update));
    };

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageUpdated(handleMessageUpdated);
    socketService.onMessageStatusUpdated(handleMessageStatusUpdated);

    if (socketService.isConnected()) setConnected(true);

    return () => {
      socketService.leaveOrder(orderId);
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageUpdated(handleMessageUpdated);
      socketService.offMessageStatusUpdated(handleMessageStatusUpdated);
    };
  }, [orderId, showSnackbar]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#e5ddd5' }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ 
        bgcolor: '#f0f0f0', 
        color: 'text.primary',
        position: 'relative'
      }}>
        <Toolbar>
          <Avatar sx={{ 
            bgcolor: getAvatarColor(customer.name), 
            width: 40, 
            height: 40, 
            mr: 2 
          }}>
            {getInitials(customer.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.phone || 'No phone'} • Order #{customer.order_number}
            </Typography>
          </Box>
          <ConnectionStatus connected={connected} />
        </Toolbar>
      </AppBar>

      {/* Alerts */}
      {!hasValidPhone && (
        <Fade in>
          <Alert 
            severity="warning" 
            icon={<PhoneDisabled />}
            sx={{ m: 2, borderRadius: 1 }}
          >
            {customer.name} doesn't have a phone number. Add one to start messaging.
          </Alert>
        </Fade>
      )}

      {/* Upload Progress */}
      <Backdrop open={uploading} sx={{ zIndex: 9999, color: '#fff' }}>
        <Paper sx={{ p: 3, minWidth: 300, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Uploading File</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedFile?.name}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <CircularProgress variant="determinate" value={uploadProgress} size={60} />
            <Typography variant="h6" sx={{ mt: 1 }}>{uploadProgress}%</Typography>
          </Box>
        </Paper>
      </Backdrop>

      {/* Messages Area */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c8c8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}>
        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <MessageSkeleton key={i} isRight={i % 2 === 0} />
            ))}
          </Box>
        ) : groupedMessages.length === 0 ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.95)' }}>
              <Typography color="text.secondary">
                {!hasValidPhone 
                  ? `Add a phone number to start messaging`
                  : `No messages yet. Start a conversation!`}
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Box>
            {groupedMessages.map(group => (
              <Box key={group.date}>
                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                  <Divider sx={{ flexGrow: 1 }} />
                  <Box sx={{ 
                    px: 2, 
                    py: 0.5, 
                    bgcolor: 'rgba(225, 245, 254, 0.92)',
                    borderRadius: 2,
                    mx: 2
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: '#54656f',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {formatDate(group.date)}
                    </Typography>
                  </Box>
                  <Divider sx={{ flexGrow: 1 }} />
                </Box>
                {group.messages.map(message => (
                  <MessageItem 
                    key={message.id} 
                    message={message} 
                    customer={customer} 
                    isMyMessage={isMyMessage(message)} 
                  />
                ))}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Selected File Preview */}
      {selectedFile && (
        <Zoom in>
          <Paper sx={{ p: 1.5, mx: 2, mb: 1, borderRadius: 2, bgcolor: '#f0f0f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedFile.type.startsWith('image/') ? <Image /> : 
                 selectedFile.type.startsWith('video/') ? <VideoFile /> :
                 selectedFile.type.startsWith('audio/') ? <AudioFile /> : <Description />}
                <Box>
                  <Typography variant="body2" fontWeight="medium">{selectedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setSelectedFile(null)} disabled={uploading}>
                <Close />
              </IconButton>
            </Box>
          </Paper>
        </Zoom>
      )}

      {/* Input Area */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          bgcolor: '#f0f0f0',
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
          style={{ display: 'none' }} 
        />
        
        <IconButton 
          disabled={isInputDisabled} 
          onClick={() => fileInputRef.current?.click()}
          sx={{ color: '#54656f' }}
        >
          <AttachFile />
        </IconButton>
        
        <TextField 
          fullWidth 
          variant="outlined" 
          size="small"
          placeholder={!hasValidPhone ? "Add phone number first" 
            : !connected ? 'Connecting...' 
            : uploading ? 'Uploading...'
            : `Message ${customer.name}...`}
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress} 
          disabled={isInputDisabled}
          sx={{ 
            '& .MuiOutlinedInput-root': { 
              borderRadius: 3,
              bgcolor: 'white',
              '& fieldset': {
                borderColor: '#e0e0e0'
              }
            } 
          }}
        />
        
        <IconButton 
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || isInputDisabled}
          sx={{ 
            bgcolor: '#25d366',
            color: 'white',
            '&:hover': { 
              bgcolor: '#128c7e'
            },
            '&:disabled': { 
              bgcolor: '#e0e0e0',
              color: '#a0a0a0'
            }
          }}
        >
          {sending || uploading ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </IconButton>
      </Paper>

      {/* Toast Notifications - Top Left */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Slide}
        sx={{ top: 24, right: 24 }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ 
            borderRadius: 1,
            boxShadow: 3,
            minWidth: 250
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatWindow;