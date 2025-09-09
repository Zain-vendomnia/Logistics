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
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { Customer, FilterOptions } from './CustomersChat';

// Constants
const SIDEBAR_WIDTH = 360;
const STATUS_COLORS = {
  online: '#4caf50',
  away: '#ff9800',
  busy: '#f44336',
  offline: '#9e9e9e',
} as const;

const AVATAR_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
  '#c2185b', '#00796b', '#5d4037', '#455a64'
];

// Utility functions
const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const getAvatarColor = (name: string): string =>
  AVATAR_COLORS[name.length % AVATAR_COLORS.length];

const formatTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Props interface
interface CustomerListProps {
  customers: Customer[];
  selectedCustomerId: number | null;
  onSelectCustomer: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onClearAll: () => void;
  stats: {
    total: number;
    filtered: number;
    online: number;
    unread: number;
  };
}

// Customer item component
const CustomerItem = memo<{
  customer: Customer;
  isSelected: boolean;
  searchQuery: string;
  onClick: () => void;
}>(({ customer, isSelected, searchQuery, onClick }) => {
  // console.log("------------------------------------------------")
  // console.log(customer)
  // console.log("------------------------------------------------")
  // Highlight search matches
  const highlightText = useCallback((text: string): React.ReactNode => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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

  const getMessage = () => {
    if (customer.lastMessage) return customer.lastMessage;
    if (customer.message_type === 'image') return '📷 Image';
    if (customer.message_type === 'document') return '📎 Document';
    if (customer.message_type === 'voice') return '🎤 Voice message';
    return 'No messages yet';
  };

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
        transition: 'background-color 0.2s'
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
            }} />
          }
        >
          <Avatar sx={{ 
            bgcolor: getAvatarColor(customer.name),
            width: 40,
            height: 40 
          }}>
            {getInitials(customer.name)}
          </Avatar>
        </Badge>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1, mr: 1 }} noWrap>
              {highlightText(customer.name)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" sx={{ 
                color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary' 
              }}>
                {formatTime(customer.timestamp || customer.lastActive)}
              </Typography>
              {customer.unreadCount > 0 && (
                <Badge badgeContent={customer.unreadCount} color={isSelected ? 'default' : 'primary'} />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Typography variant="body2" sx={{
            color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {getMessage()}
          </Typography>
        }
      />
    </ListItem>
  );
});

CustomerItem.displayName = 'CustomerItem';

// Main component
const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  stats,
}) => {
  console.log("-------------------------------------------------")
  console.log(customers)
  console.log("-------------------------------------------------")
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.showUnreadOnly) count++;
    if (filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

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
          {stats.unread > 0 && (
            <Chip label={`${stats.unread} unread`} size="small" color="primary" />
          )}
        </Toolbar>
      </AppBar>

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

        {/* Results count */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {hasActiveFilters 
            ? `Showing ${stats.filtered} of ${stats.total}`
            : `${stats.total} customers • ${stats.online} online`}
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

      {/* Customer List */}
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
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default memo(CustomerList);