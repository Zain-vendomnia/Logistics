import React from "react";
import { 
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme
} from "@mui/material";
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from "@mui/icons-material";

import { getCurrentUser } from "../../services/auth.service";


const Profile: React.FC = () => {
  const currentUser = getCurrentUser();
  const theme = useTheme();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Profile Header */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3
          }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: theme.palette.primary.main,
                fontSize: '2rem',
                mb: 2
              }}
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5" component="h1" fontWeight="bold">
              {currentUser.username}
            </Typography>
            <Chip
              label={currentUser.role}
              color="primary"
              size="small"
              sx={{ mt: 1, fontWeight: 600 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* User Details */}
          <List>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Username" 
                secondary={currentUser.username} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EmailIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Email" 
                secondary={currentUser.email} 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SecurityIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Role" 
                secondary={
                  <Chip 
                    label={currentUser.role} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                } 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;