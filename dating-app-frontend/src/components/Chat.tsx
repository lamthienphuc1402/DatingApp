import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";

// Định nghĩa kiểu cho tin nhắn
interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
}

interface ChatProps {
  userId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserProfilePicture: string[];
  targetUserIsOnline: boolean;
  onBack: () => void;
}

const Chat: React.FC<ChatProps> = ({
  userId,
  targetUserId,
  targetUserName,
  targetUserProfilePicture,
  targetUserIsOnline,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1000); // Cập nhật tin nhắn mỗi 1 giây
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/chat/messages?userId1=${userId}&userId2=${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessages(response.data);
    } catch (err) {
      setError("Không thể lấy tin nhắn.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const response = await axios.post(
        `http://localhost:3000/chat/send`,
        {
          senderId: userId,
          receiverId: targetUserId,
          content: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessages((prevMessages) => [...prevMessages, response.data]);
      setNewMessage("");
    } catch (err) {
      setError("Không thể gửi tin nhắn.");
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    try {
      return format(parseISO(date), "HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    setIsAtBottom(scrollHeight - scrollTop === clientHeight);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-pink-500">
        <button
          onClick={onBack}
          className="p-2 mr-3 text-white hover:bg-white/20 rounded-full transition duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex items-center">
          <div className="relative">
            <img
              src={targetUserProfilePicture?.[0] || "/default-avatar.png"}
              alt={targetUserName}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 ${targetUserIsOnline ? "bg-green-400" : "bg-gray-400"} border-2 border-white rounded-full`}></span>
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-white">{targetUserName}</h3>
            <p className="text-xs text-white/80">
              {targetUserIsOnline ? "Đang hoạt động" : "Đang không hoạt động"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" onScroll={handleScroll}>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.senderId === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.senderId === userId
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {formatDate(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-4 border-t border-gray-200 bg-white text-black">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
