import { ReactNode, useState } from "react";

import MenuIcon from "@mui/icons-material/Menu";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
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

interface Props {
  menuItems?: { text: string; icon: ReactNode; path: string }[];
  onMenuItemClick?: (path: string) => void;
}

const Sidebar = ({ menuItems, onMenuItemClick }: Props) => {
  const { user, showDriverBoard, showAdminBoard, showSuperAdminBoard } =
    useAuth();

  const userImage = "https://www.w3schools.com/howto/img_avatar.png";
  const [isOpen, setIsOpen] = useState(false);
  const [menu, setMenu] = useState(menuItems ?? []);

  const displayName = user?.username.split("@")[0] || user?.username;

  const toggleSidebar = () => setIsOpen(!isOpen);

  if (!user) return null;
  return (
    <Box
      display="flex"
      height={"100vh"}
      borderRight={"1px solid"}
      borderColor={"grey.300"}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isOpen ? 240 : 60,
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
        <List sx={{ backgroundColor: grey[200], py: "20px", mt: "10px" }}>
          {menuItems?.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => onMenuItemClick?.(item.path)}>
                {" "}
                {/* component={Link} to={item.path} */}
                {/* 311bf3 */}
                <ListItemIcon>{item.icon}</ListItemIcon>
                {isOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;
