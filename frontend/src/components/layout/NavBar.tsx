import { useEffect, useState } from "react";
import { AppBar, Box, Button, Stack, Toolbar, Badge } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import EventBus from "../../common/EventBus";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLayoutNavigator } from "../../hooks/useLayoutNavigator";
import { socketService } from "../../services/unreadCountService";

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
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    "&:hover, &:focus, &:active": {
      textDecoration: "underline",
      textUnderlineOffset: "6px",
      backgroundColor: "transparent",
    },
  },
};

const NavBar = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logo = "/sunniva_white.svg";
  
  // State for total unread messages count
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);

  const isActive = (path: string) => location.pathname === path;

  const getNavButtonStyles = (path: string) => ({
    backgroundColor: isActive(path) ? "white" : "transparent",
    color: isActive(path) ? "#f7941d" : "inherit",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 500,
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    "&:hover": {
      backgroundColor: isActive(path)
        ? "secondary.dark"
        : "rgba(255,255,255,0.1)",
    },
  });

  // Socket connection for total unread count
  useEffect(() => {
    if (showAdminBoard && user) {
      socketService.connect();
      const socket = socketService.getSocket();
      
      // Listen for total unread count updates
      const handleTotalUnreadUpdate = (data: any) => {
        setTotalUnreadCount(data.totalUnreadCount || 0);
      };

      socket?.on('total-unread-update', handleTotalUnreadUpdate);
      
      // Request initial total unread count
      socket?.emit('request-total-unread');

      return () => {
        socket?.off('total-unread-update', handleTotalUnreadUpdate);
      };
    }
  }, [showAdminBoard, user]);

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
          <Stack direction="row" spacing={1} alignItems="center">
            {showSuperAdminBoard && (
              <>
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  sx={getNavButtonStyles("/register")}
                >
                  <GroupIcon sx={{ fontSize: '1.1rem' }} />
                  Employees
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  sx={getNavButtonStyles("/register")}
                >
                  <PersonIcon sx={{ fontSize: '1.1rem' }} />
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
                  <PersonIcon sx={{ fontSize: '1.1rem' }} />
                  Drivers
                </Button>
                <Button
                  component={Link}
                  to="/profile"
                  color="inherit"
                  sx={getNavButtonStyles("/profile")}
                >
                  <AccountBoxIcon sx={{ fontSize: '1.1rem' }} />
                  Profile
                </Button>
               
                {/* Chat button with unread count badge */}
                <Box sx={{ position: 'relative' }}>
                  <Button
                    component={Link}
                    to="/chat"
                    color="inherit"
                    sx={getNavButtonStyles("/chat")}
                  >
                    <ChatIcon sx={{ fontSize: '1.1rem' }} />
                    Chat
                  </Button>
                  {totalUnreadCount > 0 && (
                    <Badge 
                      badgeContent={totalUnreadCount} 
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: '5px',
                        right: '8px',
                        '& .MuiBadge-badge': {
                          backgroundColor: '#ff1744',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          minWidth: '16px',
                          height: '16px',
                          borderRadius: '8px',
                          border: '1px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }
                      }}
                    />
                  )}
                </Box>
              </>
            )}

            {showDriverBoard && (
              <>
                {location.pathname !== "/driver" && (
                  <Button sx={style.navButton} component={Link} to="/driver">
                    <DashboardIcon sx={{ fontSize: '1.1rem' }} />
                    Dashboard
                  </Button>
                )}
                <Button sx={style.navButton} component={Link} to="/profile">
                  <PersonIcon sx={{ fontSize: '1.1rem' }} />
                  Profile
                </Button>
              </>
            )}
            <Button sx={style.navButton} onClick={handleLogout}>
              <LogoutIcon sx={{ fontSize: '1.1rem' }} />
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