import React, { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import { Link } from "react-router-dom";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import { grey } from "@mui/material/colors";
import { getCurrentUser } from "../../services/auth.service";
import Toolbar from "@mui/material/Toolbar";

interface SidebarProps {
  menuItems: { text: string; icon: React.ReactNode; path: string }[];
  onMenuItemClick: (path: string) => void;
}

const Sidebar = ({ menuItems, onMenuItemClick }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const userImage = "https://www.w3schools.com/howto/img_avatar.png";
  const username = "John Doe";
  const email = "user@exapmple.com";

  const currnetUser = getCurrentUser();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box display="flex">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isOpen ? 240 : 60,
          bgcolor: "grey.100",
          transition: "width 0.3s",
        }}
      >
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={isOpen ? "space-between" : "center"}
          px={2}
          height={"20vh"}
          bgcolor={"grey.200"}
        >
          {isOpen && (
            <Box className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <img
                  src={userImage}
                  alt="User"
                  className="rounded-circle mr-2"
                  style={{ width: 60, height: 60 }}
                />
                <span className="ml-3">{username}</span>
              </div>
              <div className="mt-2">
                <span>{email}</span>
              </div>
            </Box>
          )}
          <IconButton onClick={toggleSidebar} sx={{ p: 0 }}>
            {isOpen ? (
              <NavigateBeforeIcon fontSize="medium" />
            ) : (
              <MenuIcon fontSize="medium" />
            )}
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ backgroundColor: grey[200], py: "20px", mt: "10px" }}>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => onMenuItemClick(item.path)}>
                {" "}
                {/* component={Link} to={item.path} */}
                {/* 311bf3 */}
                <ListItemIcon>{item.icon}</ListItemIcon>
                {isOpen && <ListItemText primary={item.text} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box
          bgcolor={grey[200]}
          height={isOpen ? "10vh" : "5vh"}
          mt={"auto"}
        ></Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
