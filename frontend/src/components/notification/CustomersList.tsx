import React, { memo, useState, useMemo, useCallback } from 'react';
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
  Divider,
  Badge,
  Chip,
  FormControlLabel,
  Switch,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Circle as CircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { Customer, FilterOptions, CustomerListProps } from './shared/types';
import { 
  getInitials, 
  getAvatarColor, 
  formatTime, 
  STATUS_COLORS,
  createSearchRegex,
  getMessageDisplay
} from './shared/utils';

// Constants
const SIDEBAR_WIDTH = 360;

// Extended interface to include connection status
interface ExtendedCustomerListProps extends CustomerListProps {
  connected?: boolean;
}

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

ConnectionStatus.displayName = 'ConnectionStatus';

// Customer item component with enhanced real-time indicators for single event
const CustomerItem = memo<{
  customer: Customer;
  isSelected: boolean;
  searchQuery: string;
  onClick: () => void;
}>(({ customer, isSelected, searchQuery, onClick }) => {
  // Memoize search highlighting
  const highlightText = useCallback((text: string): React.ReactNode => {
    if (!searchQuery) return text;
    
    const regex = createSearchRegex(searchQuery);
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <Box key={i} component="span" sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          px: 0.5, 
          borderRadius: 0.5 
        }}>
          {part}
        </Box>
      ) : part
    );
  }, [searchQuery]);

  // Memoize message display
  const messageDisplay = useMemo(() => getMessageDisplay(customer), [customer]);

  // Check if message is recent (within last 5 minutes) - enhanced for single event
  const isRecentMessage = useMemo(() => {
    if (!customer.timestamp) return false;
    const messageTime = new Date(customer.timestamp).getTime();
    const now = Date.now();
    return (now - messageTime) < 5 * 60 * 1000; // 5 minutes
  }, [customer.timestamp]);

  // Enhanced logging for single event debugging
  React.useEffect(() => {
    console.log(`👤 CUSTOMER ${customer.name} RENDER:`, {
      order_id: customer.order_id,
      lastMessage: customer.lastMessage,
      timestamp: customer.timestamp,
      unreadCount: customer.unreadCount,
      messageDisplay: messageDisplay,
      isRecentMessage,
      isSelected
    });
  }, [customer.lastMessage, customer.timestamp, customer.unreadCount, customer.name, messageDisplay, isRecentMessage, isSelected]);

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
        // Enhanced highlight for new messages with single event system
        ...(isRecentMessage && !isSelected && {
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
          animation: 'pulse 2s ease-in-out infinite',
        }),
        position: 'relative'
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
            // Enhanced border for new messages
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
              {highlightText(customer.name)}
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
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: isRecentMessage ? 'bounce 1s ease-in-out' : 'none'
                    }
                  }}
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
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            )}
          </Box>
        }
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
          60% { transform: translateY(-2px); }
        }
      `}</style>
    </ListItem>
  );
});

CustomerItem.displayName = 'CustomerItem';

// Main component - optimized for single WebSocket event
const CustomerList: React.FC<ExtendedCustomerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  stats,
  connected = false,
}) => {
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.showUnreadOnly) count++;
    if (filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

  // Calculate total unread messages - enhanced for single event system
  const totalUnreadCount = useMemo(() => {
    const total = customers.reduce((total, customer) => total + (customer.unreadCount || 0), 0);
    console.log('📊 Total unread count calculated:', total, 'from', customers.length, 'customers');
    return total;
  }, [customers]);

  // Handlers
  const handleFilterMenu = useCallback((event: React.MouseEvent<HTMLElement> | null) => {
    setFilterMenuAnchor(event?.currentTarget ?? null);
  }, []);

  const handleStatusFilter = useCallback((status: FilterOptions['statusFilter']) => {
    onFilterChange({ statusFilter: status });
    setFilterMenuAnchor(null);
  }, [onFilterChange]);

  const handleUnreadToggle = useCallback((checked: boolean) => {
    onFilterChange({ showUnreadOnly: checked });
  }, [onFilterChange]);

  const hasActiveFilters = activeFiltersCount > 0 || searchQuery;

  // Enhanced logging for single event debugging
  React.useEffect(() => {
    console.log('📋 CustomerList render:', {
      customersCount: customers.length,
      totalUnreadCount,
      connected,
      hasActiveFilters,
      selectedCustomerId
    });
  }, [customers.length, totalUnreadCount, connected, hasActiveFilters, selectedCustomerId]);

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
                sx={{
                  animation: connected ? 'none' : 'pulse 2s ease-in-out infinite'
                }}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Connection Status Bar for single event system */}
      {!connected && (
        <Box sx={{ 
          p: 1, 
          bgcolor: 'warning.light', 
          color: 'warning.contrastText',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <CircularProgress size={16} color="inherit" />
          <Typography variant="caption">
            Reconnecting to real-time updates...
          </Typography>
        </Box>
      )}

      {/* Search & Filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Search bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          
          <IconButton 
            onClick={handleFilterMenu}
            sx={{ 
              border: 1,
              borderColor: activeFiltersCount > 0 ? 'primary.main' : 'divider',
              color: activeFiltersCount > 0 ? 'primary.main' : 'text.secondary'
            }}
          >
            <Badge badgeContent={activeFiltersCount} color="primary">
              <FilterIcon />
            </Badge>
          </IconButton>
        </Box>

        {/* Active filters */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
            {filters.showUnreadOnly && (
              <Chip
                size="small"
                label="Unread"
                onDelete={() => handleUnreadToggle(false)}
                color="primary"
                variant="outlined"
              />
            )}
            {filters.statusFilter !== 'all' && (
              <Chip
                size="small"
                label={filters.statusFilter}
                onDelete={() => handleStatusFilter('all')}
                color="primary"
                variant="outlined"
              />
            )}
            <Button size="small" onClick={onClearAll}>
              Clear all
            </Button>
          </Box>
        )}

        {/* Results count - enhanced for single event system */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {hasActiveFilters 
            ? `Showing ${stats.filtered} of ${stats.total}`
            : `${stats.total} customers • ${stats.online} online${connected ? ' • Live updates' : ''}`}
        </Typography>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => handleFilterMenu(null)}
        PaperProps={{ sx: { minWidth: 200 } }}
      >
        <Box sx={{ p: 2 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={filters.showUnreadOnly}
                onChange={(e) => handleUnreadToggle(e.target.checked)}
              />
            }
            label="Unread only"
          />
        </Box>
        <Divider />
        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>
            STATUS
          </Typography>
          {(['all', 'online', 'away', 'busy', 'offline'] as const).map(status => (
            <MenuItem
              key={status}
              selected={filters.statusFilter === status}
              onClick={() => handleStatusFilter(status)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {status !== 'all' && (
                  <CircleIcon sx={{ fontSize: 12, color: STATUS_COLORS[status] }} />
                )}
                <Typography variant="body2">
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Box>
      </Menu>

      {/* Customer List - optimized for single event updates */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {customers.length > 0 ? (
          <List sx={{ p: 0 }}>
            {customers.map(customer => (
              <CustomerItem
                key={customer.order_id}
                customer={customer}
                isSelected={selectedCustomerId === customer.order_id}
                searchQuery={searchQuery}
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
            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              {hasActiveFilters ? 'No matches found' : 'No customers yet'}
            </Typography>
            {!connected && (
              <Typography variant="caption" color="error">
                Check connection for real-time updates
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
          60% { transform: translateY(-2px); }
        }
      `}</style>
    </Drawer>
  );
};

export default memo(CustomerList);