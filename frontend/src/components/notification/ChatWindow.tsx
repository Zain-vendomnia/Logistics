import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Avatar, IconButton, Paper, TextField,
  CircularProgress, Alert, Dialog, DialogContent, DialogTitle
} from '@mui/material';
import {
  AttachFile, Send, Close, PhoneDisabled, Image, Description,
  Check, DoneAll, AccessTime, ErrorOutline
} from '@mui/icons-material';
import { 
  getMessagesByOrderId, sendMessage, socketService, uploadFile,
  updateMessageInArray, updateMessageStatus, isOptimisticMessage
} from '../../services/messageService';
import { Customer, ChatWindowProps, Message, MessageRequest } from './shared/types';
import { getInitials, getAvatarColor } from './shared/utils';

interface GroupedMessage {
  date: string;
  messages: Message[];
}

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

const MediaDisplay = ({ message }: { message: Message }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  if (message.fileType?.startsWith('image/') && message.fileUrl && !imageError) {
    return (
      <>
        <Box sx={{ position: 'relative', cursor: 'pointer', borderRadius: 1, overflow: 'hidden', maxWidth: 200 }}>
          <img 
            src={message.fileUrl} 
            alt={message.fileName || 'Image'}
            style={{ 
              width: '100%', 
              height: 'auto', 
              maxHeight: 200, 
              objectFit: 'cover'
            }}
            onError={() => setImageError(true)}
            onClick={() => setShowFullImage(true)}
          />
        </Box>
        
        <Dialog open={showFullImage} onClose={() => setShowFullImage(false)} maxWidth="lg">
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>{message.fileName || 'Image'}</Typography>
              <IconButton onClick={() => setShowFullImage(false)}>
                <Close />
              </IconButton>
            </Box>
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
        cursor: message.fileUrl ? 'pointer' : 'default'
      }}
      onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
    >
      {message.fileType?.includes('image') ? <Image /> : <Description />}
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {message.fileName || 'File'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Click to open
        </Typography>
      </Box>
    </Paper>
  );
};

const MessageItem = React.memo<{ 
  message: Message; 
  customer: Customer; 
  isMyMessage: boolean;
}>(({ message, customer, isMyMessage }) => {
  const senderName = isMyMessage ? 'You' : customer.name;
  const isMediaMessage = message.message_type === 'file' || message.type !== 'text';
  const isOptimistic = isOptimisticMessage(message);

  return (
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
        height: 32
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
            ...(isOptimistic && { opacity: 0.8 })
          }}
        >
          {message.content && !message.content.startsWith('[') && (
            <Typography variant="body2" sx={{ mb: isMediaMessage ? 1 : 0, wordBreak: 'break-word', color: '#303030' }}>
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
        {isMyMessage && message.delivery_status && ['failed', 'error'].includes(message.delivery_status.toLowerCase()) && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'right',
              mt: 0.3,
              color: '#f44336',
              fontSize: '0.65rem'
            }}
          >
            Failed to send
          </Typography>
        )}
      </Box>
    </Box>
  );
});

const ChatWindow: React.FC<ChatWindowProps> = ({ customer, orderId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasValidPhone = useMemo(() => 
    customer.phone && customer.phone.replace(/\D/g, '') !== '', 
    [customer.phone]
  );

  const isMyMessage = useCallback((msg: Message) => 
    msg.direction === 'outbound' || msg.sender === 'You' || msg.sender === 'admin', 
    []
  );

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || !hasValidPhone) return;
    
    setSending(true);

    try {
      let messageData: MessageRequest;
      
      if (selectedFile) {
        setUploading(true);
        
        const uploadResult = await uploadFile(selectedFile, orderId.toString());
        setUploading(false);
        
        if (!uploadResult.success) return;
        
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
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
      setUploading(false);
    }
  }, [newMessage, selectedFile, sending, hasValidPhone, orderId, customer.phone]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    
    getMessagesByOrderId(orderId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    
    socketService.connect();
    socketService.joinOrder(orderId);

    const handleNewMessage = (msg: Message) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    };
    const handleMessageUpdated = (update: any) => {
      setMessages(prev => updateMessageInArray(prev, update.message, update.tempId));
    };
    const handleMessageStatusUpdated = (update: any) => {
      setMessages(prev => updateMessageStatus(prev, update.messageId, update.update));
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageUpdated(handleMessageUpdated);
    socketService.onMessageStatusUpdated(handleMessageStatusUpdated);

    return () => {
      socketService.leaveOrder(orderId);
      socketService.offNewMessage(handleNewMessage);
      socketService.offMessageUpdated(handleMessageUpdated);
      socketService.offMessageStatusUpdated(handleMessageStatusUpdated);
    };
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#e5ddd5' }}>
      <AppBar position="static" elevation={1} sx={{ bgcolor: '#f0f0f0', color: 'text.primary' }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: getAvatarColor(customer.name), width: 40, height: 40, mr: 2 }}>
            {getInitials(customer.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
    {customer.name}
  </Typography>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      {customer.phone || 'No phone'}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      <strong>Order</strong> #{customer.order_number} • <strong>Order Status:</strong> {customer.status || 'Unknown'}
    </Typography>
  </Box>
</Box>
        </Toolbar>
      </AppBar>

      {!hasValidPhone && (
        <Alert severity="warning" icon={<PhoneDisabled />} sx={{ m: 2, borderRadius: 1 }}>
          {customer.name} doesn't have a phone number. Add one to start messaging.
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : groupedMessages.length === 0 ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.95)' }}>
              <Typography color="text.secondary">
                {!hasValidPhone ? 'Add a phone number to start messaging' : 'No messages yet'}
              </Typography>
            </Paper>
          </Box>
        ) : (
          <Box>
            {groupedMessages.map(group => (
              <Box key={group.date}>
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  textAlign: 'center',
                  my: 2,
                  color: '#54656f'
                }}>
                  {new Date(group.date).toLocaleDateString()}
                </Typography>
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

      {selectedFile && (
        <Paper sx={{ p: 1.5, mx: 2, mb: 1, borderRadius: 2, bgcolor: '#f0f0f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedFile.type.startsWith('image/') ? <Image /> : <Description />}
              <Typography variant="body2">{selectedFile.name}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedFile(null)} disabled={uploading}>
              <Close />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0f0f0' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
          style={{ display: 'none' }} 
        />
        
        <IconButton disabled={sending || !hasValidPhone} onClick={() => fileInputRef.current?.click()}>
          <AttachFile />
        </IconButton>
        
        <TextField 
          fullWidth 
          variant="outlined" 
          size="small"
          placeholder={!hasValidPhone ? "Add phone number first" : `Message ${customer.name}...`}
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress} 
          disabled={sending || !hasValidPhone}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'white' } }}
        />
        
        <IconButton 
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || sending || !hasValidPhone}
          sx={{ 
            bgcolor: '#25d366',
            color: 'white',
            '&:hover': { bgcolor: '#128c7e' },
            '&:disabled': { bgcolor: '#e0e0e0', color: '#a0a0a0' }
          }}
        >
          {sending || uploading ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ChatWindow;