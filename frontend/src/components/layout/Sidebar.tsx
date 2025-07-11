import { ReactNode, useMemo, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  Typography,
  Avatar,
  Paper,
} from "@mui/material";

import {
  Menu as MenuIcon,
  NavigateBefore as NavigateBeforeIcon,
  Dashboard as DashboardIcon,
  AddRoad as TourIcon,
  Route as TourOutlinedIcon,
  DirectionsBusFilled,
  Warehouse,
  AltRoute,
  Leaderboard,
  TrendingUp,
  Moving, // Icon for Driver Performance
} from "@mui/icons-material";

import { useAuth } from "../../providers/AuthProvider";
import { useLocation, Link } from "react-router-dom";

type SidebarMenuOption = {
  text: string;
  icon?: ReactNode;
  path: string;
};

interface Props {
  menuOptions?: SidebarMenuOption[];
  onMenuItemClick?: (path: string) => void;
}

const DEFAULT_USER_IMAGE = "https://www.w3schools.com/howto/img_avatar.png";

const Sidebar = ({ menuOptions, onMenuItemClick }: Props) => {
  const location = useLocation();
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  const displayName = useMemo(() => {
    if (!user?.username) return "User";
    return user.username.includes("@") ? user.username.split("@")[0] : user.username;
  }, [user]);

  const menuItems: SidebarMenuOption[] = useMemo(() => {
    if (menuOptions) return menuOptions;

    if (showAdminBoard) {
      return [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/admin_dashboard" },
        { text: "Add Tour", icon: <TourIcon />, path: "/Admin_AddTour" },
        { text: "Tours", icon: <TourOutlinedIcon />, path: "/Admin_TourTemplates" },
        { text: "Completed Tour", icon: <AltRoute />, path: "/completed_tour" },
        { text: "Live Tour", icon: <TrendingUp />, path: "/live_tours" },
        { text: "Manage Drivers", icon: <DirectionsBusFilled />, path: "/manage_drivers" },
        { text: "Manage Warehouse", icon: <Warehouse />, path: "/manage_warehouse" },
        { text: "Driver Performance", icon: <Leaderboard  />, path: "/driver_performance" },
          { text: "UploadJobFile", icon:<Moving/>, path:"/UploadJobFile"}
      ];
    }

    if (showSuperAdminBoard) {
      return [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/admin_dashboard" },
      ];
    }

    return [];
  }, [menuOptions, showAdminBoard, showSuperAdminBoard]);

  // Hide sidebar for drivers
  if (!user || showDriverBoard) return null;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        bgcolor: "background.paper",
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          width: isOpen ? 260 : 72,
          transition: "all 0.3s ease",
          overflow: "hidden",
          bgcolor: "#fafafa",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          borderRadius: "0 12px 12px 0",
        }}
      >
        {/* User Info Section */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: isOpen ? "space-between" : "center",
            p: isOpen ? 2 : 1,
            height: 120,
            borderBottom: "1px solid #eee",
            borderRadius: 0,
            bgcolor: "#f0f0f0",
          }}
        >
          {isOpen && (
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={DEFAULT_USER_IMAGE} sx={{ width: 48, height: 48 }}>
                  {displayName[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight="bold" noWrap>
                    {displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
          <IconButton
            size="small"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <NavigateBeforeIcon /> : <MenuIcon />}
          </IconButton>
        </Paper>

        {/* Menu List */}
        <List sx={{ flex: 1, py: 2 }}>
          {menuItems.map((item, index) => {
            const selected = location.pathname === item.path;
            return (
              <ListItem key={index} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => onMenuItemClick?.(item.path)}
                  title={item.text}
                  sx={(theme) => ({
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    my: 0.5,
                    background: selected ? theme.palette.primary.gradient : "transparent",
                    "&:hover": {
                      background: selected ? theme.palette.primary.gradient : theme.palette.grey[100],
                    },
                  })}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isOpen ? 2 : "auto",
                      color: selected ? "black" : "text.secondary",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {isOpen && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: selected ? "bold" : "normal",
                        color: selected ? "black" : "text.primary",
                        noWrap: true,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;