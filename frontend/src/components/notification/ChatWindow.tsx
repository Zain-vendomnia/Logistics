import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Avatar, IconButton, Paper, TextField,
  CircularProgress, Alert, Dialog, DialogContent, DialogTitle, Chip
} from '@mui/material';
import {
  AttachFile, Send, Close, PhoneDisabled, Image, Description,
  Check, DoneAll, AccessTime, ErrorOutline
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import { 
  getMessagesByOrderId, sendMessage, uploadFile,
  createOptimisticMessage
} from '../../services/messageService';
import { 
  joinCustomerChat, 
  leaveCustomerChat, 
  onNewMessage, 
  onMessageStatusUpdated,
  notifyAdminViewing,
  notifyAdminLeftChat,
  offEvent,
  markMessagesAsRead 
} from '../../socket/communicationSocket';
import { Customer, ChatWindowProps, Message, MessageRequest } from './shared/types';
import { getInitials, getAvatarColor } from './shared/utils';

interface GroupedMessage {
  date: string;
  messages: Message[];
}

const ChannelIcon = ({ channel, size = 16 }: { channel?: 'whatsapp' | 'sms' | 'email'; size?: number }) => {
  const iconStyle = { fontSize: size };
  
  switch (channel) {
    case 'whatsapp':
      return <WhatsAppIcon sx={{ ...iconStyle, color: '#25d366' }} />;
    case 'sms':
      return <SmsIcon sx={{ ...iconStyle, color: '#1976d2' }} />;
    case 'email':
      return <EmailIcon sx={{ ...iconStyle, color: '#d32f2f' }} />;
    default:
      return null;
  }
};

const getChannelName = (channel?: 'whatsapp' | 'sms' | 'email'): string => {
  switch (channel) {
    case 'whatsapp': return 'WhatsApp';
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    default: return 'Unknown';
  }
};

const MessageStatusIcon = ({ 
  status, 
  channel 
}: { 
  status?: string; 
  channel?: 'whatsapp' | 'sms' | 'email' 
}) => {
  const iconStyle = { fontSize: 16, ml: 0.5 };
  const normalizedStatus = status?.toLowerCase();

  if (channel === 'whatsapp') {
    switch(normalizedStatus) {
      case 'sending':
      case 'queued':
        return <CircularProgress size={12} sx={{ ml: 0.5, color: '#8e8e93' }} />;
      case 'sent':
        return <Check sx={{ ...iconStyle, color: '#8e8e93' }} />;
      case 'delivered':
        return <DoneAll sx={{ ...iconStyle, color: '#8e8e93' }} />;
      case 'read':
        return <DoneAll sx={{ ...iconStyle, color: '#34b7f1' }} />;
      case 'failed':
      case 'error':
        return <ErrorOutline sx={{ ...iconStyle, color: '#f44336' }} />;
      default:
        return <AccessTime sx={{ ...iconStyle, color: '#8e8e93' }} />;
    }
  }
  
  if (channel === 'sms' || channel === 'email') {
    switch(normalizedStatus) {
      case 'sending':
      case 'queued':
        return <CircularProgress size={12} sx={{ ml: 0.5, color: '#8e8e93' }} />;
      case 'sent':
        return <Check sx={{ ...iconStyle, color: '#8e8e93' }} />;
      case 'delivered':
        return <DoneAll sx={{ ...iconStyle, color: '#8e8e93' }} />;
      case 'failed':
      case 'error':
        return <ErrorOutline sx={{ ...iconStyle, color: '#f44336' }} />;
      default:
        return <AccessTime sx={{ ...iconStyle, color: '#8e8e93' }} />;
    }
  }
  
  return <AccessTime sx={{ ...iconStyle, color: '#8e8e93' }} />;
};

const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};

const getMessageContent = (message: Message): string => {
  return message.content || message.message || message.body || '';
};

const groupMessagesByDate = (messages: Message[]): GroupedMessage[] => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const dateKey = new Date(message.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups)
    .map(([date, messages]) => ({
      date,
      messages: messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
  const hasMedia = Boolean(message.fileUrl);
  const messageText = getMessageContent(message);
  const showAvatar = !isMyMessage;
  const showStatus = isMyMessage;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
      mb: 1,
      alignItems: 'flex-end',
      gap: 0.5
    }}>
      {showAvatar && (
        <Avatar 
          sx={{ 
            width: 28, 
            height: 28, 
            bgcolor: getAvatarColor(customer.name),
            fontSize: '0.75rem'
          }}
        >
          {getInitials(customer.name)}
        </Avatar>
      )}
      
      <Box sx={{ 
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMyMessage ? 'flex-end' : 'flex-start'
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isMyMessage ? '#dcf8c6' : 'white',
            borderBottomRightRadius: isMyMessage ? 0 : 2,
            borderBottomLeftRadius: !isMyMessage ? 0 : 2,
            position: 'relative',
            wordBreak: 'break-word'
          }}
        >
          {hasMedia && <MediaDisplay message={message} />}
          {messageText && (
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                mt: hasMedia ? 1 : 0
              }}
            >
              {messageText}
            </Typography>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            justifyContent: 'flex-end',
            mt: 0.5
          }}>
            {message.communication_channel && (
              <ChannelIcon channel={message.communication_channel} size={12} />
            )}
            <Typography variant="caption" sx={{ color: '#667781', fontSize: '0.7rem' }}>
              {formatTime(message.created_at)}
            </Typography>
            {showStatus && (
              <MessageStatusIcon 
                status={message.status || message.delivery_status} 
                channel={message.communication_channel}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
});

const ChatWindow: React.FC<ChatWindowProps> = ({ customer, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track pending optimistic message IDs to prevent socket duplicates
  const pendingMessageIdsRef = useRef<Set<string>>(new Set());
  // Track real message IDs we've already processed from socket
  const processedSocketMessageIdsRef = useRef<Set<string>>(new Set());
  // ✅ FIXED: Track if we've already marked messages as read for this customer
  const hasMarkedAsReadRef = useRef<boolean>(false);

  const orderId = customer.order_id;
  const hasValidPhone = Boolean(customer.phone);

  const isMyMessage = useCallback((message: Message) => {
    return message.direction === 'outbound' || message.sender === 'admin';
  }, []);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  const lastChannel = useMemo(() => {
    const lastMsg = [...messages]
      .reverse()
      .find(m => m.communication_channel);
    return lastMsg?.communication_channel;
  }, [messages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || !hasValidPhone) return;

    setSending(true);
    let fileUrl: string | undefined;
    let fileType: string | undefined;
    let fileName: string | undefined;

    try {
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadFile(selectedFile, orderId.toString());
        setUploading(false);

        if (!uploadResult.success) {
          alert(`Upload failed: ${uploadResult.error}`);
          setSending(false);
          return;
        }

        fileUrl = uploadResult.fileUrl;
        fileType = selectedFile.type;
        fileName = selectedFile.name;
      }

      const messageRequest: MessageRequest = {
        orderId,
        content: newMessage.trim() || '',
        type: selectedFile ? 'file' : 'text',
        fileUrl,
        fileType,
        fileName,
      };

      const optimisticMsg = createOptimisticMessage(
        orderId,
        messageRequest.content,
        messageRequest.type,
        { fileName, fileUrl, fileType }
      );

      // Track this optimistic message ID
      pendingMessageIdsRef.current.add(optimisticMsg.id);

      setMessages(prev => [...prev, optimisticMsg]);
      setNewMessage('');
      setSelectedFile(null);

      const result = await sendMessage(orderId, messageRequest, optimisticMsg);

      if (result.success && result.message) {
        const realMessageId = result.message.id || result.message.message_id;
        
        // Mark the real message ID as processed so socket won't add it again
        if (realMessageId) {
          processedSocketMessageIdsRef.current.add(realMessageId);
        }
        
        // Remove from pending and replace optimistic with real message
        pendingMessageIdsRef.current.delete(optimisticMsg.id);
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMsg.id ? result.message! : msg
          )
        );
      } else {
        // Remove from pending on failure
        pendingMessageIdsRef.current.delete(optimisticMsg.id);
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === optimisticMsg.id
              ? { ...msg, status: 'failed', delivery_status: 'failed', errorMessage: result.error }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  }, [newMessage, selectedFile, sending, hasValidPhone, orderId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Load messages
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    
    // Clear tracking refs when order changes
    pendingMessageIdsRef.current.clear();
    processedSocketMessageIdsRef.current.clear();
    // ✅ FIXED: Reset the mark as read flag when customer changes
    hasMarkedAsReadRef.current = false;
    
    getMessagesByOrderId(orderId)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Socket listeners
  useEffect(() => {
    if (!orderId) return;

    console.log(`🔌 Joining chat: ${orderId}`);
    joinCustomerChat(orderId);
    
    // PHASE 1: Notify other admins that you're viewing this customer
    notifyAdminViewing(orderId);

    onNewMessage((data) => {
      console.log('📨 New message from socket:', data);
      const newMsg = data.message;
      const incomingId = newMsg.id || newMsg.message_id;
      
      // Skip if this message was already processed via API response
      if (incomingId && processedSocketMessageIdsRef.current.has(incomingId)) {
        console.log('⏭️ Skipping already processed message:', incomingId);
        return;
      }
      
      setMessages(prev => {
        // Check for duplicates by various ID fields
        const exists = prev.some(m => {
          // Check direct ID match
          if (m.id === incomingId || m.message_id === incomingId) return true;
          if (incomingId && (m.id === incomingId || m.message_id === incomingId)) return true;
          
          // Check twilio_sid match
          if (newMsg.twilio_sid && m.twilio_sid === newMsg.twilio_sid) return true;
          
          return false;
        });
        
        if (exists) {
          console.log('⏭️ Message already exists in state:', incomingId);
          return prev;
        }

        // Build the formatted message first
        const formattedMessage: Message = {
          id: newMsg.id || incomingId,
          order_id: orderId,
          from: newMsg.from || '',
          to: newMsg.to || '',
          body: newMsg.content || newMsg.body || '',
          sender: newMsg.direction === 'outbound' ? 'admin' : 'customer',
          content: newMsg.content || newMsg.body || '',
          message: newMsg.content || newMsg.body || '',
          direction: newMsg.direction,
          message_type: newMsg.type || newMsg.message_type || 'text',
          communication_channel: newMsg.communication_channel,
          created_at: newMsg.timestamp || newMsg.created_at || new Date().toISOString(),
          delivery_status: newMsg.status || newMsg.delivery_status || 'sent',
          status: newMsg.status || newMsg.delivery_status || 'sent',
          is_read: newMsg.is_read ? 1 : 0,
          timestamp: newMsg.timestamp || newMsg.created_at || new Date().toISOString(),
          type: newMsg.type === 'file' ? 'file' : 'text',
          fileName: newMsg.fileName,
          message_id: newMsg.id || incomingId,
          fileUrl: newMsg.fileUrl,
          fileType: newMsg.fileType,
          twilio_sid: newMsg.twilio_sid,
        };

        // ✅ FIX: For outbound messages, REPLACE pending optimistic instead of skipping
        if (newMsg.direction === 'outbound') {
          const pendingOptimisticId = Array.from(pendingMessageIdsRef.current).find(id => 
            prev.some(m => m.id === id && m.direction === 'outbound')
          );
          
          if (pendingOptimisticId) {
            console.log('🔄 Replacing optimistic message with socket message:', pendingOptimisticId, '->', incomingId);
            
            // Remove from pending set
            pendingMessageIdsRef.current.delete(pendingOptimisticId);
            
            // Mark as processed to avoid future duplicates
            if (incomingId) {
              processedSocketMessageIdsRef.current.add(incomingId);
            }
            
            // Replace the optimistic message with the real one
            return prev.map(m => m.id === pendingOptimisticId ? formattedMessage : m);
          }
        }

        console.log('✅ Adding new message from socket:', formattedMessage.id);
        
        // Mark messages as read when new inbound message arrives while viewing
        if (newMsg.direction === 'inbound') {
          setTimeout(() => {
            console.log(`📖 New inbound message received, marking as read for order: ${orderId}`);
            markMessagesAsRead(orderId);
          }, 100);
        }
        
        return [...prev, formattedMessage];
      });
    });

    onMessageStatusUpdated((data) => {
      console.log('🔄 Status updated:', data);
      
      setMessages(prev =>
        prev.map(msg => {
          if (msg.message_id === data.messageId || msg.id === data.messageId) {
            return {
              ...msg,
              status: data.status,
              delivery_status: data.status,
            };
          }
          return msg;
        })
      );
    });

    return () => {
      console.log(`📤 Leaving chat: ${orderId}`);
      leaveCustomerChat(orderId);
      
      // PHASE 1: Notify other admins that you left this customer
      notifyAdminLeftChat(orderId);
      
      offEvent('message:new');
      offEvent('message:status-updated');
    };
  }, [orderId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * ✅ FIXED: Mark messages as read only ONCE when:
   * 1. Customer is first selected AND messages are loaded
   * 2. Check if there are actually unread inbound messages
   */
  useEffect(() => {
    if (!customer || messages.length === 0 || hasMarkedAsReadRef.current) {
      return;
    }

    // Check if there are any unread inbound messages
    // is_read can be number (0/1) or boolean, so we check for falsy values
    const hasUnreadInbound = messages.some(
      msg => msg.direction === 'inbound' && !msg.is_read
    );

    if (hasUnreadInbound) {
      console.log(`📖 Marking messages as read for order: ${customer.order_id}`);
      markMessagesAsRead(customer.order_id);
      hasMarkedAsReadRef.current = true;
    } else {
      // No unread messages, still mark the flag to prevent future checks
      hasMarkedAsReadRef.current = true;
    }
  }, [customer, messages]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#e5ddd5' }}>
      <AppBar position="static" elevation={1} sx={{ bgcolor: '#f0f0f0', color: 'text.primary' }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: getAvatarColor(customer.name), width: 40, height: 40, mr: 2 }}>
            {getInitials(customer.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {customer.name}
              </Typography>
              {lastChannel && (
                <Chip 
                  icon={<ChannelIcon channel={lastChannel} size={14} />}
                  label={getChannelName(lastChannel)}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {customer.email || 'No email'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {customer.phone || 'No phone'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Order</strong> #{customer.order_number} • <strong>Status:</strong> {customer.status || 'Unknown'}
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
            {groupedMessages.map((group, groupIndex) => (
              <Box key={`${group.date}-${groupIndex}`}>
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  textAlign: 'center',
                  my: 2,
                  color: '#54656f'
                }}>
                  {new Date(group.date).toLocaleDateString()}
                </Typography>
                {group.messages.map((message, msgIndex) => (
                  <MessageItem 
                    key={message.id || message.message_id || `msg-${msgIndex}`}
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