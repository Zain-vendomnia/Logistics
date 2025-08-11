import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import './assets/ChatPopup.css';

interface User {
  name: string;
  number: string;
}

interface Message {
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
}


interface ChatPopupProps {
  user: User;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimized: () => void;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ user, onClose, isMinimized, onToggleMinimized }) => {
  const [chats, setChats] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [newMessages, setNewMessages] = useState<boolean>(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const isUserNearBottom = (): boolean => {
    const el = chatBodyRef.current;
    if (!el) return false;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}api/notifications/whatsapp/chat-history`, {
          params: { number: user.number },
        });

        const incomingMessages = res.data;
        const hasNewMessages = incomingMessages.length > chats.length;

        if (hasNewMessages) {
          const latestMessage = incomingMessages[incomingMessages.length - 1];
          const isFromOtherUser = latestMessage.direction === "inbound";

          setChats(incomingMessages);
          setNewMessages(true);

          if (isUserNearBottom() || isFromOtherUser) {
            setTimeout(() => {
              if (chatBodyRef.current) {
                chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
              }
            }, 100);
          }
        } else {
          setChats(incomingMessages);
        }

      } catch (err) {
        console.error("Error fetching chat history", err);
      }
    };

    fetchChatHistory();
    const interval = setInterval(fetchChatHistory, 4000);
    return () => clearInterval(interval);
  }, [user.number, chats.length]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const msg: Message = {
      to: user.number,
      body: newMessage,
      direction: "outbound",
      created_at: new Date().toISOString(),
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}api/notifications/send-whatsapp-chat`, msg);
      setChats((prevChats) => [...prevChats, msg]);
      setTimeout(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      }, 100);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (!isMinimized && newMessages) {
      setNewMessages(false);
    }
  }, [newMessages, isMinimized]);

  // Scroll to bottom when chat is reopened
  useEffect(() => {
    if (!isMinimized && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [isMinimized]);


  return (
    <div className={`chat-popup ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-header">
        <strong>Chat with {user.name}</strong>
        <div className="chat-header-buttons">
          <button onClick={onToggleMinimized}>
            {isMinimized ? '+' : '–'}
          </button>
          <button onClick={onClose}>×</button>
        </div>
      </div>

      {!isMinimized && (
        <div className="chat-body" ref={chatBodyRef}>
          {chats.map((chat, i) => (
            <div key={i} className={`chat-message ${chat.direction}`}>
              {chat.body}
            </div>
          ))}
        </div>
      )}

      {!isMinimized && (
        <div className="chat-input">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
};

export default ChatPopup;
