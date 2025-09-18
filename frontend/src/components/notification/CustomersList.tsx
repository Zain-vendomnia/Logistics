import React, { memo, useMemo, useCallback } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Chip,
  CircularProgress,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Circle as CircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { Customer, CustomerStats } from './shared/types';
import { 
  getInitials, 
  getAvatarColor, 
  formatTime, 
  STATUS_COLORS,
  getMessageDisplay
} from './shared/utils';

// ==========================================
// CONSTANTS
// ==========================================

const SIDEBAR_WIDTH = 360;

// ==========================================
// INTERFACES
// ==========================================

interface CustomerListProps {
  customers: Customer[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  stats: CustomerStats;
  connected?: boolean;
  isSearching?: boolean;
}

// ==========================================
// COMPONENTS
// ==========================================

// Connection status indicator
const ConnectionStatus = memo<{ connected: boolean }>(({ connected }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    {connected ? (
      <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <WifiOffIcon sx={{ fontSize: 16, color: 'error.main' }} />
    )}
    <Typography variant="caption" color={connected ? 'success.main' : 'error.main'}>
      {connected ? 'Live' : 'Offline'}
    </Typography>
  </Box>
));

// Customer item component
const CustomerItem = memo<{
  customer: Customer;
  isSelected: boolean;
  onClick: () => void;
}>(({ customer, isSelected, onClick }) => {
  const messageDisplay = useMemo(() => getMessageDisplay(customer), [customer]);

  // Check if message is recent (within last 5 minutes)
  const isRecentMessage = useMemo(() => {
    if (!customer.timestamp) return false;
    const messageTime = new Date(customer.timestamp).getTime();
    const now = Date.now();
    return (now - messageTime) < 5 * 60 * 1000;
  }, [customer.timestamp]);

  return (
    <ListItem
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        bgcolor: isSelected ? 'primary.main' : 'transparent',
        color: isSelected ? 'white' : 'inherit',
        '&:hover': {
          bgcolor: isSelected ? 'primary.dark' : 'action.hover'
        },
        borderBottom: 1,
        borderColor: 'divider',
        py: 1.5,
        transition: 'all 0.2s ease',
        ...(isRecentMessage && !isSelected && {
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
        }),
      }}
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <CircleIcon sx={{
              fontSize: 12,
              color: STATUS_COLORS[customer.status],
              bgcolor: 'background.paper',
              borderRadius: '50%',
              border: '2px solid',
              borderColor: 'background.paper'
            }} />
          }
        >
          <Avatar sx={{ 
            bgcolor: getAvatarColor(customer.name),
            width: 40,
            height: 40,
            ...(isRecentMessage && !isSelected && {
              border: '2px solid',
              borderColor: 'primary.main'
            })
          }}>
            {getInitials(customer.name)} 
          </Avatar>
        </Badge>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: customer.unreadCount > 0 ? 700 : 600, 
              flex: 1, 
              mr: 1 
            }} noWrap>
              {customer.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="caption" sx={{ 
                color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                fontWeight: customer.unreadCount > 0 ? 600 : 400
              }}>
                {formatTime(customer.timestamp || customer.lastActive)}
              </Typography>
              {customer.unreadCount > 0 && (
                <Badge 
                  badgeContent={customer.unreadCount} 
                  color={isSelected ? 'default' : 'primary'}
                />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{
              color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              fontWeight: customer.unreadCount > 0 ? 500 : 400
            }}>
              {messageDisplay}
            </Typography>
            {isRecentMessage && !isSelected && (
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: 'primary.main',
                ml: 1,
              }} />
            )}
          </Box>
        }
      />
    </ListItem>
  );
});

// Empty state component
const EmptyState = memo<{
  searchQuery: string;
  connected: boolean;
  isSearching: boolean;
}>(({ searchQuery, connected, isSearching }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 200,
    gap: 1 
  }}>
    <SearchIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
    <Typography variant="body2" color="text.secondary">
      {isSearching ? 'Searching...' : searchQuery ? `No results for "${searchQuery}"` : 'No customers yet'}
    </Typography>
    {searchQuery && !isSearching && (
      <Typography variant="caption" color="text.disabled">
        Try a different search term
      </Typography>
    )}
    {!connected && !searchQuery && (
      <Typography variant="caption" color="error">
        Check connection for real-time updates
      </Typography>
    )}
  </Box>
));

// ==========================================
// MAIN COMPONENT
// ==========================================

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  searchQuery,
  onSearchChange,
  onSearch,
  onClearSearch,
  stats,
  connected = false,
  isSearching = false,
}) => {
  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const totalUnreadCount = useMemo(() => {
    return customers.reduce((total, customer) => total + (customer.unreadCount || 0), 0);
  }, [customers]);

  const isSearchActive = searchQuery.trim().length > 0;

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  }, [onSearch]);

  const handleSelectCustomer = useCallback((customerId: number) => {
    onSelectCustomer(customerId);
  }, [onSelectCustomer]);

  // ==========================================
  // RENDER
  // ==========================================

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
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Customers
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConnectionStatus connected={connected} />
            {totalUnreadCount > 0 && (
              <Chip 
                label={`${totalUnreadCount} unread`} 
                size="small" 
                color="primary" 
              />
            )}
          </Box>
        </Toolbar>
        {/* Search progress bar */}
        {isSearching && (
          <LinearProgress 
            color="primary" 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2
            }} 
          />
        )}
      </AppBar>

      {/* Connection warning */}
      {!connected && (
        <Box sx={{ 
          p: 1, 
          bgcolor: 'warning.light', 
          color: 'warning.contrastText',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
        }}>
          <CircularProgress size={16} color="inherit" />
          <Typography variant="caption">
            Reconnecting to real-time updates...
          </Typography>
        </Box>
      )}

      {/* Search Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Search input with button */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            disabled={isSearching}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={onClearSearch}
                    disabled={isSearching}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                ...(isSearching && {
                  bgcolor: 'action.hover',
                })
              }
            }}
          />
          
          <Button
            variant="contained"
            onClick={onSearch}
            disabled={isSearching || !searchQuery.trim()}
            sx={{ 
              minWidth: 80,
              whiteSpace: 'nowrap'
            }}
          >
            {isSearching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
          </Button>
        </Box>

        {/* Search status */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {isSearching ? (
            'Searching...'
          ) : isSearchActive ? (
            `Found ${customers.length} results`
          ) : (
            `${stats.total} customers • ${stats.online} online${connected ? ' • Live updates' : ''}`
          )}
        </Typography>
      </Box>

      {/* Customer List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
        {isSearching && customers.length === 0 ? (
          // Search loading state
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: 200,
            gap: 2
          }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              Searching customers...
            </Typography>
          </Box>
        ) : customers.length > 0 ? (
          <List sx={{ p: 0 }}>
            {customers.map(customer => (
              <CustomerItem
                key={customer.order_id}
                customer={customer}
                isSelected={selectedCustomerId === customer.order_id}
                onClick={() => handleSelectCustomer(customer.order_id)}
              />
            ))}
          </List>
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            connected={connected}
            isSearching={isSearching}
          />
        )}
      </Box>
    </Drawer>
  );
};

export default memo(CustomerList);