import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { SocketContext } from "../SocketContext";
import Chat from "./Chat";

interface User {
  _id: string;
  name: string;
  profilePictures: string[];
  bio: string;
  isOnline?: boolean;
}

interface UserListsProps {
  refresh: boolean;
  onSelectUser: (userId: string) => void;
}

const UserLists: React.FC<UserListsProps> = ({ refresh, onSelectUser }) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'liked' | 'likedBy'>('matches');
  const [likedUsers, setLikedUsers] = useState<User[]>([]);
  const [likedByUsers, setLikedByUsers] = useState<User[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const usersPerPage = 5;
  const { socket }: any = useContext(SocketContext);

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
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
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
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Đã Match
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'liked'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Đã Thích
            </button>
            <button
              onClick={() => setActiveTab('likedBy')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'likedBy'
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
            {getCurrentUsers().map((user) => (
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
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                      user.isOnline ? "bg-green-500" : "bg-gray-400"
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
        </>
      )}
    </div>
  );
};

export default UserLists;