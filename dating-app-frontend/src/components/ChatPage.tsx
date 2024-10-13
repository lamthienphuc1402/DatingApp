import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chat from './Chat';

interface User {
    profilePictures: string[];
    _id: string;
    name: string;
    email: string;
    bio?: string;
    interests?: string[];
  }
const ChatPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData) {
      setUserId(userData._id);
      fetchUsers(userData._id);
    }
  }, []);

  const fetchUsers = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3000/users/nearby/${userId}?maxDistance=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Không thể lấy danh sách người dùng:', err);
    }
  };

  const handleChat = (id) => {
    setTargetUserId(id);
    setIsChatOpen(true);
  };

  return (
    <div>
      <h1 className="text-2xl">Chat</h1>
      <div className="user-list">
        {users.map((user) => (
          <div key={user._id} className="user-item">
            <h2>{user.name}</h2>
            <button onClick={() => handleChat(user._id)} className="bg-blue-500 text-white rounded py-1 px-2">Chat</button>
          </div>
        ))}
      </div>
      {isChatOpen && <Chat userId={userId} targetUserId={targetUserId} />}
    </div>
  );
};

export default ChatPage;