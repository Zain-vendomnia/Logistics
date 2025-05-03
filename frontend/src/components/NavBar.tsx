import React from "react";
import {
  AppBar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import EventBus from "../common/EventBus";
import PersonIcon from "@mui/icons-material/Person";

const NavBar: React.FC = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Subscribe to logout event
    const cleanup = EventBus.on("logout", () => {
      logout();
      navigate("/login");
    });

    return () => {
      cleanup(); // Cleanup on component unmount
    };
  }, [logout, navigate]);

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
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              mr: 2,
              textTransform: "uppercase",
              fontWeight: "bold",
              color: "inherit",
              letterSpacing: { sx: 0.5, md: 1, lg: 0 },
              textDecoration: "none",
              transition: "box-shadow 2.0s ease",
              "&:hover, &:focus, &:active": {
                boxShadow: "0px 0px 0px rgba(0,0,0,0.2)",
                color: "inherit",
                textDecoration: "none",
              },
            }}
          >
            {showDriverBoard
              ? "Driver"
              : showAdminBoard
                ? "Admin"
                : showSuperAdminBoard
                  ? "Super Admin"
                  : ""}{" "}
            Board
          </Typography>
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
                <Button color="inherit" component={Link} to="/admin-drivers">
                  Drivers
                </Button>
                <Button color="inherit" component={Link} to="/profile">
                  Profile
                </Button>
              </>
            )}
            {showDriverBoard && (
              <Button color="inherit" component={Link} to="/profile">
                <PersonIcon sx={{ mr: 0.5 }} />
                Profile
              </Button>
            )}

            <Button
              color="inherit"
              onClick={() => {
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