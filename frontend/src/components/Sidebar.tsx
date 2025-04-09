import { ReactNode, useEffect, useState } from "react";

import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import DashboardIcon from "@mui/icons-material/Dashboard";
import {
  Divider,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";

import { useAuth } from "../providers/AuthProvider";
import { useLocation, Link } from "react-router-dom";

type sidebarMenuOption = { text: string; icon?: ReactNode; path: string };

interface Props {
  menuOptions?: sidebarMenuOption[];
  onMenuItemClick?: (path: string) => void;
}

const Sidebar = ({ menuOptions, onMenuItemClick }: Props) => {
  const location = useLocation();

  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard } =
    useAuth();

  const userImage = "https://www.w3schools.com/howto/img_avatar.png";

  const [isOpen, setIsOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<sidebarMenuOption[]>(
    menuOptions || []
  );

  const displayName = user?.username.split("@")[0] || user?.username;

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (showAdminBoard) {
      setMenuItems([
        { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
        { text: "Profile", icon: <PersonIcon />, path: "/profile" },
        // { text: "Register", icon: <PersonIcon />, path: "/register" },
      ]);
    }
    if (showSuperAdminBoard) {
      setMenuItems([
        { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
        // { text: "Profile", icon: <PersonIcon />, path: "/profile" },
        // { text: "Register", icon: <PersonIcon />, path: "/register" },
      ]);
    }
  }, [showAdminBoard, showSuperAdminBoard]);

  if (!user) return null;
  return (
    <Box
      display="flex"
      height={"100%"}
      borderRight={"1px solid"}
      borderColor={"grey.300"}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isOpen ? { xs: 170, md: 200, lg: 280 } : 60,
          transition: "width 0.3s",
        }}
      >
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={isOpen ? "space-between" : "center"}
          height={"20vh"}
          bgcolor={"grey.200"}
        >
          {isOpen && (
            <Stack spacing={2} width={"80%"} pl={2}>
              <Box display={"flex"} alignItems={"center"} gap={2}>
                <Box
                  component="img"
                  src={userImage}
                  alt="user image"
                  borderRadius={"50%"}
                  sx={{ width: 60, height: 60, objectFit: "cover" }}
                />
                <Box fontWeight={600}>{displayName}</Box>
              </Box>
              <Box
                display="flex"
                flexWrap="wrap"
                width="100%"
                sx={{
                  overflowWrap: "anywhere",
                  // wordBreak: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Stack>
          )}
          {isOpen ? (
            <Box
              width={"20%"}
              height={"100%"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={toggleSidebar}
              sx={{
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: grey[400],
                },
                "&:focus": {
                  backgroundColor: grey[400],
                },
                "&:active": {
                  backgroundColor: grey[500],
                },
              }}
            >
              <IconButton onClick={toggleSidebar}>
                <NavigateBeforeIcon fontSize="medium" />
              </IconButton>
            </Box>
          ) : (
            <IconButton onClick={toggleSidebar}>
              <MenuIcon fontSize="medium" />
            </IconButton>
          )}
        </Box>
        <Divider />
        <List sx={{ bgcolor: grey[200], py: "20px", mt: "10px" }}>
          {menuItems?.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => onMenuItemClick?.(item.path)}
                sx={{
                  px: 2,
                  color:
                    location.pathname === item.path
                      ? "primary.dark"
                      : "transparent",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isOpen ? 1.5 : 0,
                    display: "flex",
                    justifyContent: "center",
                    color:
                      location.pathname === item.path ? "primary.dark" : "#222",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {isOpen && (
                  <ListItemText
                    primary={item.text}
                    sx={{
                      m: 0,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      "& .MuiTypography-root": {
                        color:
                          location.pathname === item.path
                            ? "primary.dark"
                            : "#222",
                        transition: "color 0.2s ease",
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
