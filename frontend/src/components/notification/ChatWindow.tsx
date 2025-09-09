import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Avatar, IconButton, Paper, TextField,
  CircularProgress, Chip, Alert, Snackbar, Dialog, DialogContent, DialogTitle, Input,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon, Send as SendIcon, Close as CloseIcon,
  PhoneDisabled as PhoneDisabledIcon,
} from '@mui/icons-material';
import { 
  getMessagesByOrderId, sendMessage, socketService, 
  updateMessageInArray, updateMessageStatus, isOptimisticMessage
} from '../../services/messageService';
import { Customer, ChatWindowProps, Message, MessageRequest, MessageUpdate, MessageStatusUpdate } from './shared/types';
import { getInitials, getAvatarColor, getStatusConfig, getStatusIcon, validateFile } from './shared/utils';

// Alert Components
const NoPhoneAlert = ({ customerName }: { customerName: string }) => (
  <Box sx={{ p: 2.5, mx: 2, mb: 2, bgcolor: '#fff3e0', border: '1px solid #ff9800', borderRadius: 2,
    display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)' }}>
    <PhoneDisabledIcon sx={{ color: '#e65100', fontSize: 24 }} />
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="subtitle1" sx={{ color: '#e65100', fontWeight: 600, mb: 0.5 }}>
        Unable to Send Messages
      </Typography>
      <Typography variant="body2" sx={{ color: '#bf360c', lineHeight: 1.4 }}>
        {customerName} doesn't have a phone number to message. Please add a phone number to start messaging.
      </Typography>
    </Box>
  </Box>
);

const ConnectionAlert = ({ connected }: { connected: boolean }) => !connected ? (
  <Box sx={{ p: 2, mx: 2, mb: 2, bgcolor: '#ffebee', border: '1px solid #f44336', borderRadius: 2,
    display: 'flex', alignItems: 'center', gap: 1.5, animation: 'pulse 2s infinite' }}>
    <CircularProgress size={18} sx={{ color: '#d32f2f' }} />
    <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 500 }}>
      Connecting to messaging service...
    </Typography>
  </Box>
) : null;

// Media Display Component
const MediaDisplay = ({ message }: { message: Message }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const getAuthenticatedUrl = (url: string) => {
    if (!url?.includes('api.twilio.com')) return url;
    const twilioSid = process.env.REACT_APP_TWILIO_SID;
    const twilioToken = process.env.REACT_APP_TWILIO_AUTH_TOKEN;
    if (!twilioSid || !twilioToken) return url;
    const urlObj = new URL(url);
    urlObj.username = twilioSid;
    urlObj.password = twilioToken;
    return urlObj.toString();
  };

  const getMediaIcon = (type?: string) => {
    if (type?.includes('image')) return '📷';
    if (type?.includes('video')) return '🎬';
    if (type?.includes('audio')) return '🎤';
    return '📎';
  };

  if (message.fileType?.startsWith('image/') && message.fileUrl && !imageError) {
    const authUrl = getAuthenticatedUrl(message.fileUrl);
    return (
      <>
        <Box sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', maxWidth: 200, maxHeight: 200, display: 'inline-block' }}
          onClick={() => setShowFullImage(true)}>
          <img src={authUrl} alt={message.fileName || 'Image'}
            style={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', display: 'block' }}
            onError={() => setImageError(true)} />
        </Box>
        <Dialog open={showFullImage} onClose={() => setShowFullImage(false)} maxWidth="lg">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{message.fileName || 'Image'}</Typography>
            <IconButton onClick={() => setShowFullImage(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <img src={authUrl} alt={message.fileName || 'Image'}
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1,
      minWidth: 200, cursor: message.fileUrl ? 'pointer' : 'default' }}
      onClick={() => message.fileUrl && window.open(getAuthenticatedUrl(message.fileUrl), '_blank')}>
      <Typography sx={{ fontSize: '1.2rem' }}>{getMediaIcon(message.fileType || message.type)}</Typography>
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

// Message Item Component
const MessageItem = React.memo<{ message: Message; customer: Customer; isMyMessage: boolean; }>(
  ({ message, customer, isMyMessage }) => {
    const config = getStatusConfig(message.delivery_status);
    const senderName = isMyMessage ? 'You' : customer.name;
    const isOptimistic = isOptimisticMessage(message);
    const isMediaMessage = message.message_type === 'file' || message.type !== 'text';

    return (
      <Box sx={{ display: 'flex', flexDirection: isMyMessage ? 'row-reverse' : 'row', 
        alignItems: 'flex-start', gap: 1, opacity: isOptimistic ? 0.8 : 1, transition: 'opacity 0.3s ease' }}>
        <Avatar sx={{ bgcolor: getAvatarColor(senderName), width: 24, height: 24, fontSize: '0.7rem' }}>
          {getInitials(senderName)}
        </Avatar>
        <Box sx={{ maxWidth: '70%' }}>
          <Paper sx={{ p: 1.5, bgcolor: isMyMessage ? 'primary.main' : 'grey.100', 
            color: isMyMessage ? 'white' : 'text.primary', borderRadius: 2,
            ...(isMyMessage && message.delivery_status && { borderLeft: `4px solid ${config.color}` }),
            ...(isOptimistic && { border: '1px dashed rgba(0,0,0,0.2)' }) }}>
            
            {message.content && message.content !== `[${message.type}]` && !message.content.startsWith('[Image:') && (
              <Typography variant="body2" sx={{ mb: isMediaMessage ? 1 : 0 }}>
                {message.content}
              </Typography>
            )}
            
            {(isMediaMessage || message.fileUrl) && <MediaDisplay message={message} />}
          </Paper>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, 
            flexDirection: isMyMessage ? 'row-reverse' : 'row' }}>
            <Typography variant="caption" color="text.secondary">
              {senderName} • {message.timestamp}
            </Typography>
            {isMyMessage && message.delivery_status && (
              <Chip size="small" icon={getStatusIcon(config.icon, config.color)} label={config.label}
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500, color: config.text,
                  bgcolor: config.bg, border: `1px solid ${config.color}`, 
                  '& .MuiChip-icon': { color: config.color, ml: 0.5 } }} />
            )}
          </Box>
        </Box>
      </Box>
    );
  }
);

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

  const hasValidPhone = useMemo(() => customer.phone && customer.phone.replace(/\D/g, '') !== '', [customer.phone]);
  const isInputDisabled = sending || !connected || !hasValidPhone;
  const isMyMessage = useCallback((msg: Message) => 
    msg.direction === 'outbound' || msg.sender === 'You' || msg.sender.startsWith('You:'), []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || !connected) return;
    
    if (!customer.phone || customer.phone.replace(/\D/g, '') === '') {
      setError("Can't send message: Customer doesn't have a phone number");
      return;
    }
    
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

      const result = await sendMessage(orderId, messageData);
      if (result.success) {
        setSuccessMessage('Message sent successfully!');
      } else {
        setError(result.error || 'Failed to send message');
        if (!selectedFile) setNewMessage(content);
      }
    } catch (err) {
      setError('Failed to send message');
      if (!selectedFile) setNewMessage(content);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [newMessage, selectedFile, sending, connected, orderId, customer.phone]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Fetch messages
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    
    getMessagesByOrderId(orderId)
      .then(setMessages)
      .catch(() => {
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

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
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
  }, [orderId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          <Avatar sx={{ bgcolor: getAvatarColor(customer.name), width: 32, height: 32, mr: 2 }}>
            {getInitials(customer.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.phone || 'No phone number'} • Order Number: {customer.order_number}
            </Typography>
          </Box>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: connected ? 'success.main' : 'error.main', mr: 1 }} />
          <Typography variant="caption" color={connected ? 'success.main' : 'error.main'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Alert Messages */}
      {!hasValidPhone && <NoPhoneAlert customerName={customer.name} />}
      <ConnectionAlert connected={connected} />

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
        {messages.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" sx={{ textAlign: 'center', fontSize: '1rem' }}>
              {!hasValidPhone 
                ? `Add a phone number for ${customer.name} to start messaging`
                : `No messages yet. Start a conversation with ${customer.name}!`}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.map(message => (
              <MessageItem key={message.id} message={message} customer={customer} isMyMessage={isMyMessage(message)} />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Selected file preview */}
      {selectedFile && (
        <Box sx={{ p: 1, bgcolor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.2rem' }}>📷</Typography>
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
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper', 
        borderTop: 1, borderColor: 'divider',
        ...(isInputDisabled && { bgcolor: '#f5f5f5', opacity: 0.8 }) }}>
        <Input type="file" inputRef={fileInputRef} onChange={handleFileSelect}
          inputProps={{ accept: 'image/*' }} sx={{ display: 'none' }} />
        <IconButton disabled={isInputDisabled} onClick={() => fileInputRef.current?.click()}
          sx={{ color: isInputDisabled ? '#bdbdbd' : 'action.active' }}>
          <AttachFileIcon />
        </IconButton>
        <TextField fullWidth variant="outlined" size="small"
          placeholder={!hasValidPhone ? "Add phone number to send messages" 
            : !connected ? 'Connecting to messaging service...' 
            : `Type a message to ${customer.name}...`}
          value={newMessage} onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress} disabled={isInputDisabled}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3,
            bgcolor: isInputDisabled ? '#f9f9f9' : 'background.paper',
            '& input': { color: isInputDisabled ? '#757575' : 'text.primary' },
            '& input::placeholder': { color: isInputDisabled ? '#9e9e9e' : 'text.secondary', opacity: 1 }
          }}}
        />
        <IconButton color="primary" onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || isInputDisabled}
          sx={{ bgcolor: isInputDisabled ? '#e0e0e0' : 'primary.main', 
            color: isInputDisabled ? '#9e9e9e' : 'white', 
            '&:hover': { bgcolor: isInputDisabled ? '#e0e0e0' : 'primary.dark' }, 
            '&:disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' } }}>
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Error/Success Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </Box>
  );
};

export default ChatWindow;