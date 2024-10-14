import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// Định nghĩa kiểu cho tin nhắn
interface Message {
  id: number;
  senderId: string;
  content: string;
  createdAt: string;
}

const Chat = ({ userId, targetUserId, targetUserName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Cập nhật tin nhắn mỗi 5 giây
    return () => clearInterval(interval);
  }, [userId, targetUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/chat/messages?userId1=${userId}&userId2=${targetUserId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMessages(response.data);
    } catch (err) {
      setError('Không thể lấy tin nhắn.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const response = await axios.post(`http://localhost:3000/chat/send`, {
        senderId: userId,
        receiverId: targetUserId,
        content: newMessage,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMessages((prevMessages) => [...prevMessages, response.data]);
      setNewMessage('');
    } catch (err) {
      setError('Không thể gửi tin nhắn.');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg shadow-md">
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{targetUserName}</h2>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && <p className="text-red-500 text-center">{error}</p>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.senderId === userId ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center p-4 bg-white border-t border-gray-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="text-black bg-white flex-1 border rounded-full py-2 px-4 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tin nhắn..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
