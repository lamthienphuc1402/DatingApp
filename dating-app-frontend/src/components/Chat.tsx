// Import các thư viện cần thiết
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns"; // Thư viện xử lý thời gian
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"; // Component chọn emoji
import { useSocket } from '../SocketContext'; // Hook quản lý kết nối socket

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  _id: string; // ID duy nhất của tin nhắn
  senderId: string; // ID người gửi
  receiverId: string; // ID người nhận
  content: string; // Nội dung tin nhắn
  isRead: boolean; // Trạng thái đã đọc
  createdAt: string; // Thời gian tạo
  reactions?: { // Các phản ứng emoji
    [key: string]: string[]; // Key là emoji, value là mảng ID người dùng đã reaction
  };
}

// Định nghĩa props cho component Chat
interface ChatProps {
  userId: string; // ID người dùng hiện tại
  targetUserId: string; // ID người dùng đang chat
  targetUserName: string; // Tên người dùng đang chat
  targetUserProfilePicture: string[]; // Ảnh đại diện người dùng
  targetUserIsOnline: boolean; // Trạng thái online của người dùng
  onBack: () => void; // Hàm xử lý khi quay lại
}

// Component Chat chính
const Chat: React.FC<ChatProps> = ({
  userId,
  targetUserId,
  targetUserName,
  targetUserProfilePicture,
  targetUserIsOnline,
  onBack,
}) => {
  // Khởi tạo các state và hooks
  const { socket } = useSocket(); // Hook quản lý kết nối socket
  const [messages, setMessages] = useState<Message[]>([]); // State lưu danh sách tin nhắn
  const [newMessage, setNewMessage] = useState(""); // State lưu tin nhắn mới
  const [error, setError] = useState(""); // State lưu lỗi
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref cho phần cuối danh sách tin nhắn
  const [isAtBottom, setIsAtBottom] = useState(true); // State kiểm tra vị trí scroll
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State hiển thị bảng chọn emoji
  const [showReactionPicker, setShowReactionPicker] = useState<{ // State hiển thị bảng chọn reaction
    messageId: string;
    show: boolean;
  }>({ messageId: "", show: false });

  // Effect xử lý kết nối socket và lắng nghe tin nhắn
  useEffect(() => {
    if (!socket) return;

    // Gửi yêu cầu lấy tin nhắn ban đầu
    socket.emit('getMessages', { userId1: userId, userId2: targetUserId });

    // Lắng nghe tin nhắn mới
    socket.on('message', (newMessage: Message) => {
      if (newMessage.senderId === targetUserId || newMessage.senderId === userId) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    // Lắng nghe danh sách tin nhắn
    socket.on('messages', (messageList: Message[]) => {
      setMessages(messageList);
    });

    // Lắng nghe lỗi
    socket.on('error', (error: { message: string }) => {
      setError(error.message);
    });

    // Cleanup khi component unmount
    return () => {
      socket.off('message');
      socket.off('messages');
      socket.off('error');
    };
  }, [socket, userId, targetUserId]);

  // Effect tự động scroll xuống khi có tin nhắn mới
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Effect xử lý click ngoài bảng chọn emoji
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

  // Effect xử lý click ngoài bảng chọn reaction
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

  // Hàm scroll xuống cuối danh sách tin nhắn
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Hàm xử lý gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    // Gửi tin nhắn qua socket
    socket.emit('sendMessage', {
      senderId: userId,
      receiverId: targetUserId,
      content: newMessage,
    });
    
    setNewMessage(""); // Reset input
  };

  // Hàm format thời gian
  const formatDate = (date: string) => {
    if (!date) return "";
    try {
      return format(parseISO(date), "HH:mm");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Hàm xử lý scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    setIsAtBottom(scrollHeight - scrollTop === clientHeight);
  };

  // Hàm xử lý khi chọn emoji
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  // Hàm xử lý thêm reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!socket) return;

    // Gửi reaction qua socket
    socket.emit('addReaction', {
      messageId,
      userId,
      emoji,
    });

    setShowReactionPicker({ messageId: "", show: false });
  };

  // Render component
  return (
    <div className="flex flex-col h-full">
      {/* Header của chat */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          {/* Nút quay lại */}
          <button
            onClick={onBack}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          {/* Thông tin người dùng đang chat */}
          <div className="flex items-center">
            <div className="relative">
              <img
                src={targetUserProfilePicture?.[0] || "https://via.placeholder.com/40"}
                alt={targetUserName}
                className="w-10 h-10 rounded-full object-cover"
              />
              {/* Chỉ báo trạng thái online */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                  targetUserIsOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold">{targetUserName}</h3>
              <p className="text-sm text-gray-500">
                {targetUserIsOnline ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phần nội dung chat */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col w-full">
          {/* Danh sách tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto">
            {error && <p className="text-red-500 text-center">{error}</p>}
            {messages.map((message, index) => (
              <div
                key={message._id}
                className={`flex ${
                  message.senderId === userId ? "justify-end" : "justify-start"
                }`}
              >
                <div className="relative group max-w-[70%]">
                  {/* Bong bóng tin nhắn */}
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

                  {/* Nút reaction cho tin nhắn của đối phương */}
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

                  {/* Hiển thị các reaction */}
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

                  {/* Bảng chọn reaction */}
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

          {/* Form nhập tin nhắn */}
          <div className="p-4 border-t">
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
                  {/* Nút chọn emoji */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 emoji-button"
                  >
                    <span className="emoji">😊</span>
                  </button>
                  {/* Bảng chọn emoji */}
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
              {/* Nút gửi tin nhắn */}
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
      </div>
    </div>
  );
};

export default Chat;