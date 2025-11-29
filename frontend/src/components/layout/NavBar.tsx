import { useEffect } from "react";
import { AppBar, Badge, Box, Button, Stack, Toolbar } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import EventBus from "../../common/EventBus";
import {
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  AccountBox as AccountBoxIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useLayoutNavigator } from "../../hooks/useLayoutNavigator";
import useUnreadCount from "../../socket/Useunreadcount";


const NavBar = () => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard, logout } = useAuth();
  const { clearSessionStack } = useLayoutNavigator();
  const { unreadCount } = useUnreadCount();
  const location = useLocation();
  const navigate = useNavigate();
  const logo = "/sunniva_white.svg";
  const path = location.pathname;

  const isActive = (p: string) => path === p;
  const navStyle = (p: string) => ({
    color: isActive(p) ? "#f7941d !important" : "#fff !important",
    backgroundColor: isActive(p) ? "white !important" : "transparent !important",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 500,
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
    gap: 0.5,
    "&:hover": {
      backgroundColor: isActive(p) ? "red !important" : "red !important",
      color: isActive(p) ? "#fff !important" : "#fff !important",
    },
  });

  useEffect(() => EventBus.on("logout", () => {
    logout();
    navigate("/login");
  }), [logout, navigate]);

  const handleLogout = () => {
    clearSessionStack();
    EventBus.dispatch("logout");
  };

  const isParkingForm = path === "/ParkingPermitForm";

  return (
    <AppBar position="sticky" sx={{ background: (theme) => theme.palette.primary.headerGradient, height: 50, boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}>
      <Toolbar sx={{ minHeight: "50px !important", px: 2 }}>
        <Box display="flex" flexGrow={1} alignItems="center" gap={2}>
          <Box component="img" src={logo} alt="Logo" sx={{ height: 36, cursor: "pointer" }} onClick={() => navigate("/")} />
        </Box>

        {!isParkingForm && user && (
          <Stack direction="row" spacing={1} alignItems="center">
            {showSuperAdminBoard && (
              <>
                <Button component={Link} to="/register" sx={navStyle("/register")}><GroupIcon sx={{ fontSize: '1.1rem' }} />Employees</Button>
                <Button component={Link} to="/register" sx={navStyle("/register")}><PersonIcon sx={{ fontSize: '1.1rem' }} />Drivers</Button>
              </>
            )}

            {showAdminBoard && (
              <>
                <Button component={Link} to="/admin-drivers" sx={navStyle("/admin-drivers")}><PersonIcon sx={{ fontSize: '1.1rem' }} />Drivers</Button>
                <Button component={Link} to="/profile" sx={navStyle("/profile")}><AccountBoxIcon sx={{ fontSize: '1.1rem' }} />Profile</Button>
                
                {/* Chat button with unread count badge */}
                <Button component={Link} to="/chat" sx={navStyle("/chat")}>
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    max={99}
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.7rem",
                        minWidth: "18px",
                        height: "18px",
                        top: -4,
                        right: -4,
                      },
                    }}
                  >
                    <ChatIcon sx={{ fontSize: '1.1rem' }} />
                  </Badge>
                  Chat
                </Button>
              </>
            )}

            {showDriverBoard && path !== "/driver" && (
              <Button component={Link} to="/driver" sx={{ color: "#fff", textTransform: "none", display: "flex", alignItems: "center", gap: 0.5 }}><DashboardIcon sx={{ fontSize: '1.1rem' }} />Dashboard</Button>
            )}
            {showDriverBoard && <Button component={Link} to="/profile" sx={{ color: "#fff", textTransform: "none", display: "flex", alignItems: "center", gap: 0.5 }}><PersonIcon sx={{ fontSize: '1.1rem' }} />Profile</Button>}

            <Button sx={{ color: "#fff", textTransform: "none", display: "flex", alignItems: "center", gap: 0.5 }} onClick={handleLogout}><LogoutIcon sx={{ fontSize: '1.1rem' }} />Log Out</Button>
          </Stack>
        )}

        {!isParkingForm && !user && <Button component={Link} to="/login" sx={navStyle("/login")}>Login</Button>}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;