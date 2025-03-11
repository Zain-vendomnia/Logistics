import React from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container,
  Paper,
  Button,
} from "@mui/material";

const drawerWidth = 240;

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Global CSS Reset */}
      <CssBaseline />

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <List>
          {["Home", "About", "Contact"].map((text) => (
            <ListItem key={text}>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap>
              My MUI Page
            </Typography>
          </Toolbar>
        </AppBar>

        <Toolbar />

        {/* Page Content */}
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ padding: 3, textAlign: "center" }}>
            <Typography variant="h4" gutterBottom>
              Welcome to Material UI Page!
            </Typography>
            <Typography variant="body1">
              This is a simple example of how to structure a page using MUI
              components.
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              Get Started
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
