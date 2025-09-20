import { useEffect } from "react";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import EventBus from "../../common/EventBus";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useLayoutNavigator } from "../../hooks/useLayoutNavigator";

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
const NavBar = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard, logout } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logo = "/sunniva_white.svg";

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

  useEffect(() => {
    const cleanup = EventBus.on("logout", () => {
      logout();
      navigate("/login");
    });
    return () => cleanup();
  }, [logout, navigate]);

  const { clearSessionStack } = useLayoutNavigator();

  const handleLogout = () => {
    clearSessionStack();
    EventBus.dispatch("logout");
  };

  const isParkingPermitFormPage = location.pathname === "/ParkingPermitForm";
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
        <Box display="flex" flexGrow={1} alignItems="center" gap={2}>
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{ height: 36, width: "auto", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
        </Box>

        {/* Only show menu if not on ParkingPermitForm */}
        {!isParkingPermitFormPage && user && (
          <Stack direction="row" spacing={0} alignItems="center">
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
               
                <Button
                  component={Link}
                  to="/chat"
                  color="inherit"
                  sx={getNavButtonStyles("/customer-chat")}
                >
                  Chat
                </Button>
              </>
            )}

            {showDriverBoard && (
              <>
                {location.pathname !== "/driver" && (
                  <Button sx={style.navButton} component={Link} to="/driver">
                    <DashboardIcon sx={{ mr: 0.5 }} />
                    Dashboard
                  </Button>
                )}
                <Button sx={style.navButton} component={Link} to="/profile">
                  <PersonIcon sx={{ mr: 0.5 }} />
                  Profile
                </Button>
              </>
            )}
            <Button sx={style.navButton} onClick={handleLogout}>
              Log Out
            </Button>
          </Stack>
        )}

        {!isParkingPermitFormPage && !user && (
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
