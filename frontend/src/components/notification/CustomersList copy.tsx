// import React, { memo, useMemo, useCallback } from 'react';
// import {
//   Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemText,
//   ListItemAvatar, Avatar, Box, TextField, InputAdornment, IconButton,
//   Badge, CircularProgress, Button
// } from '@mui/material';
// import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
// import { Customer } from './shared/types';
// import { getInitials, getAvatarColor, formatTime, getMessageDisplay } from './shared/utils';

// const SIDEBAR_WIDTH = 360;

// interface CustomerListProps {
//   customers: Customer[];
//   selectedCustomerId: number | null;
//   onSelectCustomer: (id: number) => void;
//   searchQuery: string;
//   onSearchChange: (query: string) => void;
//   onSearch: () => void;
//   onClearSearch: () => void;
//   isSearching?: boolean;
// }

// const CustomerItem = memo<{
//   customer: Customer;
//   isSelected: boolean;
//   onClick: () => void;
// }>(({ customer, isSelected, onClick }) => {
//   const messageDisplay = useMemo(() => getMessageDisplay(customer), [customer]);

//   return (
//     <ListItem
//       onClick={onClick}
//       sx={{
//         cursor: 'pointer',
//         bgcolor: isSelected ? 'primary.main' : 'transparent',
//         color: isSelected ? 'white' : 'inherit',
//         '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
//         borderBottom: 1,
//         borderColor: 'divider',
//         py: 1.5
//       }}
//     >
//       <ListItemAvatar>
//         <Avatar sx={{ 
//           bgcolor: getAvatarColor(customer.name),
//           width: 40,
//           height: 40
//         }}>
//           {getInitials(customer.name)}
//         </Avatar>
//       </ListItemAvatar>

//       <ListItemText
//         primary={
//           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Typography variant="subtitle2" sx={{ 
//               fontWeight: customer.unreadCount > 0 ? 700 : 600,
//               flex: 1,
//               mr: 1
//             }} noWrap>
//               {customer.name}
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
//               <Typography variant="caption" sx={{ 
//                 color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary'
//               }}>
//                 {formatTime(customer.timestamp || customer.lastActive)}
//               </Typography>
//               {customer.unreadCount > 0 && (
//                 <Badge badgeContent={customer.unreadCount} color={isSelected ? 'default' : 'primary'} />
//               )}
//             </Box>
//           </Box>
//         }
//         secondary={
//           <Typography variant="body2" sx={{
//             color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary',
//             overflow: 'hidden',
//             textOverflow: 'ellipsis',
//             whiteSpace: 'nowrap',
//             fontWeight: customer.unreadCount > 0 ? 500 : 400
//           }}>
//             {messageDisplay}
//           </Typography>
//         }
//       />
//     </ListItem>
//   );
// });

// const CustomerList: React.FC<CustomerListProps> = ({
//   customers,
//   selectedCustomerId,
//   onSelectCustomer,
//   searchQuery,
//   onSearchChange,
//   onSearch,
//   onClearSearch,
//   isSearching = false
// }) => {
//   const totalUnreadCount = useMemo(() => 
//     customers.reduce((total, c) => total + (c.unreadCount || 0), 0),
//     [customers]
//   );

//   const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') onSearch();
//   }, [onSearch]);

//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         width: SIDEBAR_WIDTH,
//         flexShrink: 0,
//         '& .MuiDrawer-paper': {
//           width: SIDEBAR_WIDTH,
//           position: 'relative',
//           display: 'flex',
//           flexDirection: 'column'
//         }
//       }}
//     >
//       <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
//         <Toolbar>
//           <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
//             Customers
//           </Typography>
//           {totalUnreadCount > 0 && (
//             <Badge badgeContent={totalUnreadCount} color="primary" />
//           )}
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
//         <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
//           <TextField
//             fullWidth
//             size="small"
//             placeholder="Search customers..."
//             value={searchQuery}
//             onChange={(e) => onSearchChange(e.target.value)}
//             onKeyPress={handleSearchKeyPress}
//             disabled={isSearching}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon fontSize="small" />
//                 </InputAdornment>
//               ),
//               endAdornment: searchQuery && (
//                 <InputAdornment position="end">
//                   <IconButton size="small" onClick={onClearSearch} disabled={isSearching}>
//                     <ClearIcon fontSize="small" />
//                   </IconButton>
//                 </InputAdornment>
//               )
//             }}
//           />
          
//           <Button
//             variant="contained"
//             onClick={onSearch}
//             disabled={isSearching || !searchQuery.trim()}
//             sx={{ minWidth: 80 }}
//           >
//             {isSearching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
//           </Button>
//         </Box>

//         <Typography variant="caption" color="text.secondary">
//           {isSearching ? 'Searching...' : `${customers.length} customers`}
//         </Typography>
//       </Box>

//       <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
//         {customers.length > 0 ? (
//           <List sx={{ p: 0 }}>
//             {customers.map(customer => (
//               <CustomerItem
//                 key={customer.order_id}
//                 customer={customer}
//                 isSelected={selectedCustomerId === customer.order_id}
//                 onClick={() => onSelectCustomer(customer.order_id)}
//               />
//             ))}
//           </List>
//         ) : (
//           <Box sx={{ 
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             height: 200,
//             gap: 1
//           }}>
//             <SearchIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
//             <Typography variant="body2" color="text.secondary">
//               {searchQuery ? `No results for "${searchQuery}"` : 'No customers yet'}
//             </Typography>
//           </Box>
//         )}
//       </Box>
//     </Drawer>
//   );
// };

// export default memo(CustomerList);


export {};
