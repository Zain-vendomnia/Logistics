import React, { memo } from 'react';
import {
  Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Box, Badge, Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import { Customer, CustomerListProps } from './shared/types';
import { getInitials, getAvatarColor } from './shared/utils';

const SIDEBAR_WIDTH = 360;

// Get channel icon based on communication channel
const ChannelIcon = ({ channel }: { channel?: 'whatsapp' | 'sms' | 'email' | 'none' | null }) => {
  const iconStyle = { fontSize: 14 };
  
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

// Format timestamp to relative time
const formatTimestamp = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);
  
  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

// Truncate message preview
const truncateMessage = (message: string, maxLength: number = 35): string => {
  if (!message) return '';
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

const CustomerItem = memo<{
  customer: Customer;
  isSelected: boolean;
  onClick: () => void;
}>(({ customer, isSelected, onClick }) => {
  return (
    <ListItem
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.main' : 'transparent',
        color: isSelected ? 'white' : 'inherit',
        '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
        borderBottom: 1,
        borderColor: 'divider',
        py: 1.5
      }}
    >
      <ListItemAvatar>
        <Badge
          badgeContent={customer.unread_count || 0}
          color="error"
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          invisible={!customer.unread_count || customer.unread_count === 0}
        >
          <Avatar sx={{ 
            bgcolor: getAvatarColor(customer.name || 'Unknown'),
            width: 40,
            height: 40
          }}>
            {getInitials(customer.name || 'Unknown')}
          </Avatar>
        </Badge>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 600,
              flex: 1
            }} noWrap>
              {customer.name || 'Unknown Customer'}
            </Typography>
            
            {customer.last_message_time && (
              <Typography variant="caption" sx={{
                color: isSelected ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                fontSize: '0.7rem',
                ml: 1
              }}>
                {formatTimestamp(customer.last_message_time)}
              </Typography>
            )}
          </Box>
        }
        secondary={
          <>
            <Typography variant="body2" sx={{
              color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              fontSize: '0.875rem',
              mb: 0.5
            }}>
              {customer.phone || customer.order_number || 'No contact info'}
            </Typography>
            
            {customer.last_message && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <ChannelIcon channel={customer.last_channel} />
                <Typography 
                  variant="body2" 
                  sx={{
                    color: isSelected ? 'rgba(255,255,255,0.9)' : 'text.primary',
                    fontSize: '0.8rem',
                    fontWeight: customer.unread_count ? 600 : 400,
                    flex: 1
                  }}
                  noWrap
                >
                  {truncateMessage(customer.last_message)}
                </Typography>
              </Box>
            )}
          </>
        }
        secondaryTypographyProps={{
          component: 'div'
        }}
      />
    </ListItem>
  );
});

CustomerItem.displayName = 'CustomerItem';

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  totalUnreadCount = 0
}) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Customers
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {totalUnreadCount > 0 && (
              <Chip 
                label={totalUnreadCount} 
                size="small" 
                color="error"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}
            <Typography variant="body2" color="text.secondary">
              {customers.length}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {customers.length > 0 ? (
          <List sx={{ p: 0 }}>
            {customers.map(customer => (
              <CustomerItem
                key={customer.order_id}
                customer={customer}
                isSelected={selectedCustomerId === customer.order_id}
                onClick={() => onSelectCustomer(customer.order_id)}
              />
            ))}
          </List>
        ) : (
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            gap: 1
          }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              No customers in transit
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default memo(CustomerList);