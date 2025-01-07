import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

// Định nghĩa kiểu cho tin nhắn
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  reactions?: {
    [key: string]: string[];
  };
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<{
    messageId: string;
    show: boolean;
  }>({ messageId: "", show: false });

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".EmojiPickerReact") &&
        !target.closest(".emoji-button") &&
        !target.closest(".emoji")
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".EmojiPickerReact") &&
        !target.closest(".reaction-button")
      ) {
        setShowReactionPicker({ messageId: "", show: false });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCAL_API_URL
        }/chat/messages?userId1=${userId}&userId2=${targetUserId}`,
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
        `${import.meta.env.VITE_LOCAL_API_URL}/chat/send`,
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_LOCAL_API_URL
        }/chat/messages/${messageId}/reactions`,
        {
          userId,
          emoji,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: response.data.reactions }
            : msg
        )
      );

      setShowReactionPicker({ messageId: "", show: false });
    } catch (err) {
      setError("Không thể thêm reaction.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-lg">
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
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 ${
                targetUserIsOnline ? "bg-green-400" : "bg-gray-400"
              } border-2 border-white rounded-full`}
            ></span>
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
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        onScroll={handleScroll}
      >
        {error && <p className="text-red-500 text-center">{error}</p>}
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`flex ${
              message.senderId === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div className="relative group max-w-[70%]">
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.senderId === userId
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {formatDate(message.createdAt)}
                </span>
              </div>

              {/* Chỉ hiển thị nút reaction cho tin nhắn của đối phương */}
              {message.senderId !== userId && (
                <button
                  onClick={() =>
                    setShowReactionPicker({
                      messageId: message._id,
                      show: true,
                    })
                  }
                  className="reaction-button opacity-0 group-hover:opacity-100 absolute -right-2 -top-2"
                >
                  😊
                </button>
              )}

              {/* Hiển thị reactions */}
              {message.reactions &&
                Object.entries(message.reactions).length > 0 && (
                  <div className="reactions-display absolute -bottom-6 left-0 bg-white rounded-full shadow-lg px-2 py-1">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      <span
                        key={emoji}
                        className="reaction-item"
                        title={users.join(", ")}
                      >
                        {emoji} {users.length}
                      </span>
                    ))}
                  </div>
                )}

              {/* Điều chỉnh vị trí Emoji Picker */}
              {showReactionPicker.messageId === message._id &&
                showReactionPicker.show && (
                  <div
                    className="absolute z-[1000]"
                    style={{
                      left: message.senderId === userId ? "auto" : "100%",
                      right: message.senderId === userId ? "100%" : "auto",
                      top: "0",
                      marginLeft: "8px",
                      marginRight: "8px",
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) =>
                        handleReaction(message._id, emojiData.emoji)
                      }
                      width={250}
                      height={350}
                      previewConfig={{
                        showPreview: false,
                      }}
                    />
                  </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="p-4 border-t border-gray-200 bg-white text-black rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <div>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 emoji-button"
              >
                <span className="emoji">😊</span>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-[calc(100%+400px)] right-[200px] z-50">
                  <div className="emoji-picker-container animate-slide-up">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      autoFocusSearch={false}
                      width={250}
                      height={400}
                      previewConfig={{
                        showPreview: false,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
