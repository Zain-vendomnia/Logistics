import React, { useState } from 'react';
import ChatPopup from './ChatPopup';
import './assets/ChatPopup.css';

interface User {
  name: string;
  number: string;
}

const userList: User[] = [
  { name: 'Jahanzaib', number: '+971501084381' },
  { name: 'Ahmed', number: '+971501234567' },
  { name: 'Ali', number: '+971509876543' },
];



const MultiUserChat: React.FC = () => {
  const [openChats, setOpenChats] = useState<User[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<Set<string>>(new Set());

  const openChat = (user: User) => {
    if (!openChats.find(u => u.number === user.number)) {

      setOpenChats([...openChats, user]);
    }
  };
  const closeChat = (number: string) => {
    setOpenChats(openChats.filter(chat => chat.number !== number));
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
    <div>
      <h3>Available Users</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        {userList.map((user) => (
          <button key={user.number} onClick={() => openChat(user)}>
            Chat with {user.name}
          </button>
        ))}
      </div>

      <div className="floating-chat-container">
        {openChats.map((user, idx) => (
          <div
            key={user.number}
            className="chat-popup-wrapper"
            style={{ right: `${idx * 320 + 20}px` }}
          >
            <ChatPopup
              user={user}
              onClose={() => closeChat(user.number)}
              isMinimized={minimizedChats.has(user.number)}
              onToggleMinimized={() => toggleMinimize(user.number)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiUserChat;
