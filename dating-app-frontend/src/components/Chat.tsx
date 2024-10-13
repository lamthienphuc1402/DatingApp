import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Định nghĩa kiểu cho tin nhắn
interface Message {
  id: number;
  senderId: string;
  content: string;
}

const Chat = ({ userId, targetUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/chat/${userId}/${targetUserId}`);
        setMessages(response.data as Message[]);
      } catch (err) {
        setError('Không thể lấy tin nhắn.');
      }
    };

    fetchMessages();
  }, [userId, targetUserId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/chat/send`, {
        senderId: userId,
        receiverId: targetUserId,
        content: newMessage,
      });
      setMessages((prevMessages) => [...prevMessages, response.data as Message]);
      setNewMessage('');
    } catch (err) {
      setError('Không thể gửi tin nhắn.');
    }
  };

  return (
    <div className="chat-container">
      <h2 className="text-2xl mb-4">Chat với {targetUserId}</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border rounded w-full py-2 px-3"
          placeholder="Nhập tin nhắn..."
          required
        />
        <button type="submit" className="bg-blue-500 text-white rounded py-2 px-4 ml-2">Gửi</button>
      </form>
    </div>
  );
};

export default Chat;
