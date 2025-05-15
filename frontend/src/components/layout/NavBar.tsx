import React from "react";
import {
  AppBar,
  Box,
  Button,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import EventBus from "../../common/EventBus";
import PersonIcon from "@mui/icons-material/Person";
const style = {
  navButton: {
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 500,
    textTransform: "none",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    padding: "6px 12px",
    letterSpacing: 0.25,
    minWidth: 0,
    lineHeight: 1.75,
    "&:hover, &:focus, &:active": {
      textDecoration: "underline",
      textUnderlineOffset: "6px",
      backgroundColor: "transparent",
    },
  },
};
const NavBar: React.FC = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logo = "/sunniva_white.svg";

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

  const isLoginPage = location.pathname === "/login";

  return (
    <AppBar
      position="sticky"
      sx={(theme)=>({
        background: theme.palette.primary.headerGradient,
        height: 50,
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
      })}
    >
      <Toolbar sx={{ minHeight: "50px !important", px: 2 }}>
        <Box display="flex" flexGrow={1} alignItems="center" gap={2}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: 36, width: "auto", cursor: "pointer" }}
          />
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
            {showAdminBoard }
            {showSuperAdminBoard }
          </Typography>
        </Box>

        {user ? (
          <Stack direction="row" spacing={0} alignItems="center">
            {showSuperAdminBoard && (
              <>
                <Button sx={style.navButton} component={Link} to="/register">
                  Employees
                </Button>
                <Button sx={style.navButton} component={Link} to="/register">
                  Drivers
                </Button>
              </>
            )}
            {showAdminBoard && (
              <>

                <Button color="inherit" component={Link} to="/admin-drivers">

                  Drivers
                </Button>
                <Button sx={style.navButton} component={Link} to="/profile">
                  Profile
                </Button>
              </>
            )}
            {showDriverBoard && (
              <Button sx={style.navButton} component={Link} to="/profile">
                <PersonIcon sx={{ mr: 0.5 }} />
                Profile
              </Button>
            )}
            <Button
              sx={style.navButton}
              onClick={() => {
                EventBus.dispatch("logout");
              }}
            >
              Log Out
            </Button>
          </Stack>
        ) : isLoginPage ? (
          <Button sx={style.navButton} component={Link} to="/login">
            Login
          </Button>
        ) : null}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;