import React, { useState } from "react";
import ChatPopup from "./ChatPopup";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import "./assets/ChatPopup.css";

interface User {
  name: string;
  number: string;
}

const userList: User[] = [
  { name: "Jahanzaib", number: "+971501084381" },
  { name: "Ahmed", number: "+971501234567" },
  { name: "Ali", number: "+971509876543" },
  { name: "Nagaraj", number: "+971551246787" },
];

const MultiUserChat: React.FC = () => {
  const [openChats, setOpenChats] = useState<User[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<Set<string>>(new Set());

  const openChat = (user: User) => {
    if (!openChats.find((u) => u.number === user.number)) {
      setOpenChats([...openChats, user]);
    }
  };

  const closeChat = (number: string) => {
    setOpenChats(openChats.filter((chat) => chat.number !== number));
    setMinimizedChats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(number);
      return newSet;
    });
  };

  const toggleMinimize = (number: string) => {
    setMinimizedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(number)) {
        newSet.delete(number);
      } else {
        newSet.add(number);
      }
      return newSet;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Available Users
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        {userList.map((user) => (
          <Card
            key={user.number}
            sx={{
              width: 200,
              borderRadius: 3,
              boxShadow: 3,
              transition: "all 0.2s",
              "&:hover": { boxShadow: 6, transform: "translateY(-3px)" },
            }}
          >
            <CardContent
              sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}
            >
              <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                {user.name.charAt(0)}
              </Avatar>
              <Typography variant="subtitle1" fontWeight="600">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.number}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<ChatIcon />}
                onClick={() => openChat(user)}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Chat
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Floating chat windows */}
      <Box className="floating-chat-container">
        {openChats.map((user, idx) => (
          <Box
            key={user.number}
            className="chat-popup-wrapper"
            sx={{
              position: "fixed",
              bottom: 20,
              right: `${idx * 340 + 20}px`,
              width: 320,
              borderRadius: 3,
              boxShadow: 4,
              overflow: "hidden",
              backgroundColor: "background.paper",
            }}
          >
            <ChatPopup
              user={user}
              onClose={() => closeChat(user.number)}
              isMinimized={minimizedChats.has(user.number)}
              onToggleMinimized={() => toggleMinimize(user.number)}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MultiUserChat;
