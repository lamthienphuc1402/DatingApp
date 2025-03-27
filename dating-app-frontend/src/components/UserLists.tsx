// Import các thư viện cần thiết
import React, { useState, useEffect, useContext, useCallback } from "react"; // Import React và các hooks
import axios from "axios"; // Import thư viện HTTP client
import { motion } from "framer-motion"; // Import thư viện animation
import { SocketContext } from "../SocketContext"; // Import context quản lý socket
import Chat from "./Chat"; // Import component chat
import ApproveNotice from "./Home/ApproveNotice"; // Import component thông báo match
import { format } from "date-fns"; // Import thư viện format thời gian

// Định nghĩa interface cho tin nhắn cuối cùng
interface LastMessage {
  content: string; // Nội dung tin nhắn
  createdAt: string; // Thời gian tạo
  isRead: boolean; // Trạng thái đã đọc
  senderId: string; // ID người gửi
  receiverId: string; // ID người nhận
}

// Định nghĩa interface cho thông tin người dùng
interface User {
  _id: string; // ID người dùng
  name: string; // Tên người dùng
  email: string; // Email
  bio: string; // Tiểu sử
  interests: string[]; // Danh sách sở thích
  profilePictures: string[]; // Danh sách ảnh đại diện
  age: number; // Tuổi
  zodiacSign: string; // Cung hoàng đạo
  education: string; // Học vấn
  hobbies: string; // Sở thích
  gender: "male" | "female" | "other"; // Giới tính
  genderPreference: "male" | "female" | "both"; // Xu hướng tìm kiếm
  isOnline: boolean; // Trạng thái online
  matchScore: number; // Điểm match
  lastMessage?: LastMessage; // Tin nhắn cuối cùng
}

// Định nghĩa interface cho props của component
interface UserListsProps {
  refresh: boolean; // Trạng thái refresh
  onSelectUser: (userId: string) => void; // Hàm xử lý khi chọn người dùng
  onClose?: () => void; // Hàm xử lý khi đóng component
}

// Component hiển thị thông tin chi tiết
const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) => (
  <div className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition duration-300">
    <p className="text-gray-500 text-sm mb-1">{label}</p>
    <p className="font-medium text-gray-800 capitalize">
      {value || "Chưa cập nhật"}
    </p>
  </div>
);

// Component UserLists chính
const UserLists: React.FC<UserListsProps> = ({ onClose }) => {
  // Khởi tạo các state
  const [activeTab, setActiveTab] = useState<"matches" | "liked" | "likedBy">("matches"); // Tab đang active
  const [likedUsers, setLikedUsers] = useState<User[]>([]); // Danh sách người dùng đã thích
  const [likedByUsers, setLikedByUsers] = useState<User[]>([]); // Danh sách người dùng đã thích mình
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]); // Danh sách người dùng đã match
  const [searchTerm, setSearchTerm] = useState(""); // Từ khóa tìm kiếm
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Người dùng được chọn
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null); // Profile được chọn
  const usersPerPage = 8; // Số người dùng trên mỗi trang
  const { socket }: any = useContext(SocketContext); // Socket context
  const [showNotice, setShowNotice] = useState(false); // Trạng thái hiển thị thông báo
  const [currentFromId, setCurrentFromId] = useState(""); // ID người gửi match
  const [currentMatchId, setCurrentMatchId] = useState(""); // ID người nhận match
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Ảnh được chọn

  // Effect xử lý socket events
  useEffect(() => {
    if (!socket) return;

    // Xử lý khi nhận danh sách người dùng đã match
    const handleMatchedUsers = (users: User[]) => {
      setMatchedUsers(users);
    };

    // Xử lý khi nhận danh sách người dùng đã thích
    const handleLikedUsers = (users: User[]) => {
      setLikedUsers(users);
    };

    // Xử lý khi nhận danh sách người dùng đã thích mình
    const handleLikedByUsers = (users: User[]) => {
      setLikedByUsers(users);
    };

    // Xử lý tin nhắn mới
    const handleNewMessage = (message: LastMessage) => {
      setMatchedUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          if (user._id === message.senderId) {
            return {
              ...user,
              lastMessage: message,
            };
          }
          return user;
        });
        return updatedUsers;
      });
    };

    // Xử lý khi có người dùng mới thích
    const handleNewLike = (data: { fromUserId: string; toUserId: string }) => {
      const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      if (data.toUserId === currentUserId) {
        socket.emit("getLikedByUsers", { userId: currentUserId });
      }
    };

    // Xử lý khi có match mới
    const handleNewMatch = (data: { user1Id: string; user2Id: string }) => {
      const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      if (data.user1Id === currentUserId || data.user2Id === currentUserId) {
        socket.emit("getMatchedUsers", { userId: currentUserId });
        setShowNotice(true);
        setCurrentFromId(data.user1Id);
        setCurrentMatchId(data.user2Id);
      }
    };

    // Xử lý khi có người dùng online/offline
    const handleUserStatusChange = (data: { userId: string; isOnline: boolean }) => {
      setMatchedUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user._id === data.userId) {
            return {
              ...user,
              isOnline: data.isOnline,
            };
          }
          return user;
        });
      });
    };

    // Đăng ký các socket events
    socket.on("matchedUsers", handleMatchedUsers);
    socket.on("likedUsers", handleLikedUsers);
    socket.on("likedByUsers", handleLikedByUsers);
    socket.on("newMessage", handleNewMessage);
    socket.on("newLike", handleNewLike);
    socket.on("newMatch", handleNewMatch);
    socket.on("userStatusChange", handleUserStatusChange);

    // Lấy dữ liệu ban đầu
    const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
    socket.emit("getMatchedUsers", { userId: currentUserId });
    socket.emit("getLikedUsers", { userId: currentUserId });
    socket.emit("getLikedByUsers", { userId: currentUserId });

    // Cleanup khi component unmount
    return () => {
      socket.off("matchedUsers", handleMatchedUsers);
      socket.off("likedUsers", handleLikedUsers);
      socket.off("likedByUsers", handleLikedByUsers);
      socket.off("newMessage", handleNewMessage);
      socket.off("newLike", handleNewLike);
      socket.off("newMatch", handleNewMatch);
      socket.off("userStatusChange", handleUserStatusChange);
    };
  }, [socket]);

  // Effect xử lý khi chuyển tab
  useEffect(() => {
    const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
    
    switch (activeTab) {
      case "matches":
        socket?.emit("getMatchedUsers", { userId: currentUserId });
        break;
      case "liked":
        socket?.emit("getLikedUsers", { userId: currentUserId });
        break;
      case "likedBy":
        socket?.emit("getLikedByUsers", { userId: currentUserId });
        break;
    }
  }, [activeTab, socket]);

  // Hàm đánh dấu tin nhắn là đã đọc
  const markMessagesAsRead = async (targetUserId: string) => {
    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      socket?.emit("markMessagesAsRead", { userId, targetUserId });
    } catch (error) {
      console.error("Không thể đánh dấu tin nhắn là đã đọc:", error);
    }
  };

  // Hàm xử lý khi chấp nhận match
  const handleApproveMatch = async (targetUserId: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      socket?.emit("approveMatch", {
        userId: currentUser._id,
        targetUserId: targetUserId,
      });
      setSelectedProfile(null);
    } catch (err) {
      console.error("Lỗi khi chấp nhận match:", err);
    }
  };

  // Hàm xử lý khi từ chối match
  const handleRejectMatch = (targetUserId: string) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    setSelectedProfile(null);
  };

  // Hàm format thời gian tin nhắn
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Nếu là hôm nay
    if (diff < 24 * 60 * 60 * 1000) {
      return format(date, 'HH:mm');
    }
    
    // Nếu là tuần này
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const dayName = format(date, 'EEEE');
      const dayNameMap: { [key: string]: string } = {
        'Monday': 'Thứ hai',
        'Tuesday': 'Thứ ba', 
        'Wednesday': 'Thứ tư',
        'Thursday': 'Thứ năm',
        'Friday': 'Thứ sáu',
        'Saturday': 'Thứ bảy',
        'Sunday': 'Chủ nhật'
      };
      return dayNameMap[dayName];
    }
    
    // Các trường hợp khác
    return format(date, 'dd/MM/yyyy');
  };

  // Hàm lấy tên ngắn gọn
  const getShortName = (fullName: string) => {
    const names = fullName.trim().split(' ');
    return names[names.length - 1];
  };

  // Hàm render tin nhắn cuối cùng
  const renderLastMessage = (user: User) => {
    if (!user.lastMessage) {
      return (
        <p className="text-sm text-gray-500 truncate italic">
          {user.bio || "Không có tiểu sử"}
        </p>
      );
    }

    const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;
    const isSentByMe = user.lastMessage.senderId === currentUserId;
    const messagePrefix = isSentByMe 
      ? "Bạn: "
      : `${getShortName(user.name)}: `;

    return (
      <p className={`text-sm ${
        !isSentByMe && !user.lastMessage.isRead 
          ? 'text-gray-900 font-semibold' 
          : 'text-gray-500'
      } truncate`}>
        {messagePrefix}{user.lastMessage.content}
      </p>
    );
  };

  // Hàm lấy danh sách người dùng hiện tại theo tab
  const getCurrentUsers = useCallback(() => {
    let users: User[] = [];
    switch (activeTab) {
      case "matches":
        users = matchedUsers;
        break;
      case "liked":
        users = likedUsers;
        break;
      case "likedBy":
        users = likedByUsers;
        break;
    }

    // Lọc theo từ khóa tìm kiếm
    const filteredUsers = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Phân trang
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return {
      users: filteredUsers.slice(indexOfFirstUser, indexOfLastUser),
      totalUsers: filteredUsers.length,
    };
  }, [activeTab, matchedUsers, likedUsers, likedByUsers, searchTerm, currentPage]);

  // Hàm xử lý khi chọn người dùng
  const handleSelectUser = (user: User) => {
    if (activeTab === "matches") {
      setSelectedUser(user);
      // Đánh dấu tin nhắn là đã đọc nếu cần
      if (user.lastMessage && !user.lastMessage.isRead && user.lastMessage.senderId !== JSON.parse(localStorage.getItem("user") || "{}")._id) {
        markMessagesAsRead(user._id);
      }
    } else if (activeTab === "liked" || activeTab === "likedBy") {
      setSelectedProfile(user);
    }
  };

  // Hàm quay lại danh sách
  const handleBackToList = () => {
    setSelectedUser(null);
  };

  // Hàm tính tổng số trang
  const getTotalPages = () => {
    const { totalUsers } = getCurrentUsers();
    return Math.ceil(totalUsers / usersPerPage);
  };

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Render component
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto scrollbar-custom">
      {/* Component thông báo match */}
      {showNotice && (
        <ApproveNotice
          fromUserName={currentFromId}
          toUserName={currentMatchId}
          onClose={() => setShowNotice(false)}
        />
      )}

      {/* Render chat hoặc danh sách người dùng */}
      {selectedUser ? (
        <div className="h-full">
          <Chat
            userId={JSON.parse(localStorage.getItem("user") || "{}")._id}
            targetUserId={selectedUser._id}
            targetUserName={selectedUser.name}
            targetUserProfilePicture={selectedUser.profilePictures}
            targetUserIsOnline={selectedUser.isOnline}
            onBack={handleBackToList}
          />
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab("matches")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "matches"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Đã Match
            </button>
            <button
              onClick={() => setActiveTab("liked")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "liked"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Đã Thích
            </button>
            <button
              onClick={() => setActiveTab("likedBy")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "likedBy"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Thích Mình
            </button>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Danh sách người dùng */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            {getCurrentUsers().users.map((user) => (
              <div
                key={user._id}
                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
                onClick={() => handleSelectUser(user)}
              >
                {/* Avatar và trạng thái online */}
                <div className="relative">
                  <img
                    src={user.profilePictures[0] || "https://via.placeholder.com/40"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-pink-500"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                      user.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                {/* Thông tin người dùng */}
                <div className="ml-3 flex-grow">
                  <span className="font-semibold text-gray-800">
                    {user.name}
                  </span>
                  <div className="flex flex-col">
                    {renderLastMessage(user)}
                  </div>
                </div>

                {/* Thời gian tin nhắn */}
                <div className="flex flex-col items-end">
                  {user.lastMessage?.createdAt && (
                    <span className="text-xs text-gray-400">
                      {formatMessageTime(user.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Phân trang */}
          <div className="flex justify-center items-center mt-4 space-x-2">
            {[...Array(getTotalPages())].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-pink-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal hiển thị thông tin chi tiết */}
      {selectedProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedProfile(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  Thông tin chi tiết
                </h2>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition duration-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Cột trái - Avatar và thông tin cơ bản */}
                <div className="w-full md:w-1/3">
                  <div className="sticky top-0">
                    <div className="flex flex-col items-center bg-gradient-to-b from-pink-50 to-purple-50 rounded-2xl p-6">
                      {/* Avatar */}
                      <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-white shadow-lg overflow-hidden mb-4">
                        <img
                          src={selectedProfile.profilePictures[0] || "https://via.placeholder.com/150"}
                          alt={selectedProfile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Thông tin cơ bản */}
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {selectedProfile.name}
                      </h2>
                      <p className="text-gray-600 mb-2">
                        {selectedProfile.email}
                      </p>
                      <div className="bg-white rounded-xl p-4 w-full mt-2">
                        <p className="text-gray-600 italic text-center">
                          "{selectedProfile.bio || "Chưa có tiểu sử"}"
                        </p>
                      </div>

                      {/* Nút Đồng ý/Từ chối cho tab likedBy */}
                      {activeTab === "likedBy" && (
                        <div className="flex flex-col gap-3 mt-6 w-full">
                          <button
                            onClick={() => handleApproveMatch(selectedProfile._id)}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 transition duration-300 shadow-md"
                          >
                            <i className="fas fa-heart"></i> Đồng ý
                          </button>
                          <button
                            onClick={() => handleRejectMatch(selectedProfile._id)}
                            className="w-full py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-300"
                          >
                            <i className="fas fa-times"></i> Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột phải - Thông tin chi tiết */}
                <div className="flex-1 space-y-6">
                  {/* Thông tin cá nhân */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
                    <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
                      <i className="fas fa-user-circle"></i>
                      Thông tin cá nhân
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoItem label="Tuổi" value={selectedProfile.age} />
                      <InfoItem label="Học vấn" value={selectedProfile.education} />
                      <InfoItem label="Cung hoàng đạo" value={selectedProfile.zodiacSign} />
                      <InfoItem
                        label="Giới tính"
                        value={
                          selectedProfile.gender === "male"
                            ? "Nam"
                            : selectedProfile.gender === "female"
                            ? "Nữ"
                            : "Khác"
                        }
                      />
                      <InfoItem
                        label="Xu hướng tìm kiếm"
                        value={
                          selectedProfile.genderPreference === "male"
                            ? "Nam"
                            : selectedProfile.genderPreference === "female"
                            ? "Nữ"
                            : "Cả hai"
                        }
                      />
                    </div>
                  </div>

                  {/* Sở thích */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
                    <h3 className="text-xl font-bold text-pink-600 mb-4 flex items-center gap-2">
                      <i className="fas fa-heart"></i>
                      Sở thích
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedProfile.interests?.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-pink-50 text-pink-600 px-4 py-2 rounded-full text-sm border border-pink-200 hover:bg-pink-100 transition duration-300"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Thường làm gì khi rãnh
                    </h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-xl">
                      {selectedProfile.hobbies || "Chưa cập nhật"}
                    </p>
                  </div>

                  {/* Thư viện ảnh */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
                    <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                      <i className="fas fa-images"></i>
                      Hình ảnh
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedProfile.profilePictures.map((pic, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedImage(pic)}
                        >
                          <img
                            src={pic}
                            alt={`${selectedProfile.name} - ${index + 1}`}
                            className="w-full h-48 object-cover rounded-xl hover:opacity-90 transition duration-300 border border-gray-100"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300 rounded-xl flex items-center justify-center">
                            <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 text-xl"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem ảnh */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999]"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition duration-300"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>

            <img
              src={selectedImage}
              alt="Enlarged"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLists;