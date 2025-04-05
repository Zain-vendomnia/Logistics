import React from "react";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import EventBus from "../common/EventBus";

const NavBar: React.FC = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard } =
    useAuth();

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "primary",
        height: 50,
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <Toolbar sx={{ minHeight: "50px !important", px: 2 }}>
        <Box display="flex" flexGrow={1} alignItems="center">
          {showDriverBoard && (
            <Typography variant="h6" sx={{ mr: 2 }}>
              Driver Interface
            </Typography>
          )}

          {showAdminBoard && (
            <Button color="inherit" component={Link} to="/admin">
              Admin Board
            </Button>
          )}

          {showSuperAdminBoard && (
            <Button color="inherit" component={Link} to="/super_admin">
              Super Admin
            </Button>
          )}
        </Box>

        {user ? (
          <Stack direction="row" spacing={2} alignItems="center">
            {showSuperAdminBoard && (
              <>
                <Button color="inherit" component={Link} to="/register">
                  Employees
                </Button>
                <Button color="inherit" component={Link} to="/register">
                  Drivers
                </Button>
              </>
            )}
            {showAdminBoard && (
              <>
                <Button color="inherit" component={Link} to="/profile">
                  Drivers
                </Button>
                <Button color="inherit" component={Link} to="/profile">
                  Profile
                </Button>
              </>
            )}
            {showDriverBoard && (
              <>
                <Button color="inherit" component={Link} to="/profile">
                  Profile --
                </Button>
              </>
            )}
            <Button
              color="inherit"
              onClick={() => {
                console.log("Logout Clicked");
                EventBus.dispatch("logout");
              }}
            >
              LogOut
            </Button>
          </Stack>
        ) : (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
