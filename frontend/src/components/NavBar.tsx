import React from "react";
import {
  AppBar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import EventBus from "../common/EventBus";
import PersonIcon from "@mui/icons-material/Person";

const NavBar: React.FC = () => {
  const {
    user,
    showDriverBoard,
    showAdminBoard,
    showSuperAdminBoard,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getNavButtonStyles = (path: string) => ({
    backgroundColor: isActive(path) ? "white" : "transparent",
    color: isActive(path) ? "#f7941d" : "inherit",
    "&:hover": {
      backgroundColor: isActive(path)
        ? "secondary.dark"
        : "rgba(255,255,255,0.1)",
    },
  });

  React.useEffect(() => {
    const cleanup = EventBus.on("logout", () => {
      logout();
      navigate("/login");
    });
    return () => cleanup();
  }, [logout, navigate]);

  return (
    <AppBar
      position="sticky"
      sx={(theme) => ({
        background: theme.palette.primary.headerGradient,
        height: 50,
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      })}
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
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  sx={getNavButtonStyles("/register")}
                >
                  Employees
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  sx={getNavButtonStyles("/register")}
                >
                  Drivers
                </Button>
              </>
            )}

            {showAdminBoard && (
              <>
                <Button
                  component={Link}
                  to="/admin-drivers"
                  color="inherit"
                  sx={getNavButtonStyles("/admin-drivers")}
                >
                  Drivers
                </Button>
                <Button
                  component={Link}
                  to="/profile"
                  color="inherit"
                  sx={getNavButtonStyles("/profile")}
                >
                  Profile
                </Button>
              </>
            )}

            {showDriverBoard && (
              <Button
                component={Link}
                to="/profile"
                color="inherit"
                sx={getNavButtonStyles("/profile")}
              >
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
         <Button
          component={Link}
          to="/login"
          color="inherit"
          sx={getNavButtonStyles("/login")}
        >
          Login
        </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
