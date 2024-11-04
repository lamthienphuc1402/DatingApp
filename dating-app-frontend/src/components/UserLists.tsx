import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { SocketContext } from "../SocketContext";
import Chat from "./Chat";
import ApproveNotice from './Home/ApproveNotice';

interface User {
  _id: string;
  name: string;
  email: string;
  bio: string;
  interests: string[];
  profilePictures: string[];
  age: number;
  zodiacSign: string;
  education: string;
  hobbies: string;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'both';
}

interface UserListsProps {
  refresh: boolean;
  onSelectUser: (userId: string) => void;
  onClose?: () => void;
}

const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition duration-300">
    <p className="text-gray-500 text-sm mb-1">{label}</p>
    <p className="font-medium text-gray-800 capitalize">{value || 'Chưa cập nhật'}</p>
  </div>
);

const UserLists: React.FC<UserListsProps> = ({ refresh, onSelectUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'liked' | 'likedBy'>('matches');
  const [likedUsers, setLikedUsers] = useState<User[]>([]);
  const [likedByUsers, setLikedByUsers] = useState<User[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const usersPerPage = 8;
  const { socket }: any = useContext(SocketContext);
  const [showNotice, setShowNotice] = useState(false);
  const [currentFromId, setCurrentFromId] = useState("");
  const [currentMatchId, setCurrentMatchId] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchMatchedUsers = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const response = await axios.get(
        `http://localhost:3000/users/${userId}/matches`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMatchedUsers(response.data);
    } catch (error) {
      console.error("Không thể lấy danh sách người dùng đã match:", error);
    }
  };

  const fetchLikedUsers = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const response = await axios.get(
        `http://localhost:3000/users/${userId}/liked-users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setLikedUsers(response.data);
    } catch (error) {
      console.error("Không thể lấy danh sách người dùng đã thích:", error);
    }
  };

  const fetchLikedByUsers = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const response = await axios.get(
        `http://localhost:3000/users/${userId}/liked-by`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setLikedByUsers(response.data);
    } catch (error) {
      console.error("Không thể lấy danh sách người dùng đã thích mình:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchMatchedUsers();
    } else if (activeTab === 'liked') {
      fetchLikedUsers();
    } else if (activeTab === 'likedBy') {
      fetchLikedByUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    socket?.on("userStatus", () => {
      if (activeTab === 'matches') {
        fetchMatchedUsers();
      }
    });
  }, [socket, activeTab]);

  const getCurrentUsers = () => {
    let users: User[] = [];
    switch (activeTab) {
      case 'matches':
        users = matchedUsers;
        break;
      case 'liked':
        users = likedUsers;
        break;
      case 'likedBy':
        users = likedByUsers;
        break;
    }

    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return {
      users: filteredUsers.slice(indexOfFirstUser, indexOfLastUser),
      totalUsers: filteredUsers.length
    };
  };

  const handleSelectUser = (user: User) => {
    if (activeTab === 'matches') {
      setSelectedUser(user);
    } else if (activeTab === 'liked' || activeTab === 'likedBy') {
      setSelectedProfile(user);
    }
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  const getTotalPages = () => {
    const { totalUsers } = getCurrentUsers();
    return Math.ceil(totalUsers / usersPerPage);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleApproveMatch = async (targetUserId: string) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      await axios.post(
        'http://localhost:3000/users/like',
        {
          userId: currentUser._id,
          targetUserId: targetUserId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );

      // Đóng modal profile và refresh danh sách
      setSelectedProfile(null);
      fetchLikedByUsers();
    } catch (err) {
      console.error("Lỗi khi chấp nhận match:", err);
    }
  };

  const handleRejectMatch = (targetUserId: string) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    setSelectedProfile(null)
    fetchLikedByUsers();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto scrollbar-custom">
      {/* Header với nút đóng cho mobile */}
      <div className="flex justify-between items-center mb-4 md:hidden">
        <h2 className="text-xl font-bold text-gray-800">Tin nhắn</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
      
      {showNotice && (
        <ApproveNotice
          fromUserName={currentFromId}
          toUserName={currentMatchId}
          onClose={() => setShowNotice(false)}
        />
      )}
      {selectedUser ? (
        <div className="h-[85vh]">
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
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'matches'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Đã Match
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'liked'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Đã Thích
            </button>
            <button
              onClick={() => setActiveTab('likedBy')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'likedBy'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Thích Mình
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                <div className="relative">
                  <img
                    src={user.profilePictures[0] || "https://via.placeholder.com/40"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-pink-500"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                  />
                </div>
                <div className="ml-3 flex-grow">
                  <span className="font-semibold text-gray-800">{user.name}</span>
                  <p className="text-sm text-gray-500 truncate">
                    {user.bio || "Không có tiểu sử"}
                  </p>
                </div>
                <span className="text-xs text-gray-400">14:30</span>
              </div>
            ))}
          </motion.div>

          <div className="flex justify-center items-center mt-4 space-x-2">
            {[...Array(getTotalPages())].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 rounded ${currentPage === index + 1
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

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
              {/* Header với nút đóng */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Thông tin chi tiết</h2>
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
                      <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-white shadow-lg overflow-hidden mb-4">
                        <img
                          src={selectedProfile.profilePictures[0] || "https://via.placeholder.com/150"}
                          alt={selectedProfile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedProfile.name}</h2>
                      <p className="text-gray-600 mb-2">{selectedProfile.email}</p>
                      <div className="bg-white rounded-xl p-4 w-full mt-2">
                        <p className="text-gray-600 italic text-center">"{selectedProfile.bio || 'Chưa có tiểu sử'}"</p>
                      </div>

                      {/* Nút Đồng ý/Từ chối cho tab likedBy */}
                      {activeTab === 'likedBy' && (
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
                        value={selectedProfile.gender === 'male' ? 'Nam' : 
                               selectedProfile.gender === 'female' ? 'Nữ' : 'Khác'} 
                      />
                      <InfoItem 
                        label="Xu hướng tìm kiếm" 
                        value={selectedProfile.genderPreference === 'male' ? 'Nam' : 
                               selectedProfile.genderPreference === 'female' ? 'Nữ' : 'Cả hai'} 
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
                        <span key={index} className="bg-pink-50 text-pink-600 px-4 py-2 rounded-full text-sm border border-pink-200 hover:bg-pink-100 transition duration-300">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Thường làm gì khi rãnh</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedProfile.hobbies || 'Chưa cập nhật'}</p>
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
            onClick={e => e.stopPropagation()}
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