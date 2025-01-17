import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { SocketContext } from "../SocketContext";
import Chat from "./Chat";
import { debounce } from "lodash";

interface MatchedUser {
  _id: string;
  name: string;
  profilePictures: string[];
  isOnline: boolean;
  bio: string;
}

const MatchedUsersList = () => {
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<MatchedUser | null>(null);
  const usersPerPage = 5;
  const { socket }: any = useContext(SocketContext);

  const filteredUsers = useMemo(() => {
    const uniqueUsers = matchedUsers.reduce((acc: MatchedUser[], current) => {
      const exists = acc.find(user => user._id === current._id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matchedUsers, searchTerm]);

  const debouncedFetch = useCallback(
    debounce(async () => {
      try {
        const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
        const response = await axios.get(
          `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}/matches`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        const newData = response.data;
        const uniqueNewData = newData.filter((newUser: MatchedUser) => 
          !matchedUsers.some(existingUser => 
            existingUser._id === newUser._id && 
            existingUser.isOnline === newUser.isOnline
          )
        );

        if (uniqueNewData.length > 0) {
          setMatchedUsers(prev => [...prev, ...uniqueNewData]);
        }
      } catch (error) {
        console.error("Không thể lấy danh sách người dùng đã match:", error);
      }
    }, 500),
    [matchedUsers]
  );

  useEffect(() => {
    debouncedFetch();
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  //Handle user status
  useEffect(() => {
    socket.on("userStatus", (response: any) => {
      debouncedFetch();
    });
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: React.SetStateAction<number>) =>
    setCurrentPage(pageNumber);

  const handleSelectUser = (user: MatchedUser) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  return (
    <div className="matched-users-list bg-white rounded-lg shadow-md p-4 h-full">
      {selectedUser ? (
        <>
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
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Danh sách đã match
          </h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-black bg-white px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {matchedUsers.length === 0 ? (
            <p className="text-gray-500 text-center">
              Chưa có người dùng nào được match.
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              {currentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-lg transition duration-300 ease-in-out"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="relative">
                    <img
                      src={
                        user.profilePictures[0] ||
                        "https://via.placeholder.com/40"
                      }
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-pink-500"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    ></span>
                  </div>
                  <div className="ml-3 flex-grow">
                    <span className="font-semibold text-gray-800">
                      {user.name}
                    </span>
                    <p className="text-sm text-gray-500 truncate">
                      {user.bio || "Không có tiểu sử"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">14:30</span>
                </div>
              ))}
            </motion.div>
          )}
          <div className="mt-4 flex justify-center">
            {Array.from({
              length: Math.ceil(filteredUsers.length / usersPerPage),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === index + 1
                    ? "bg-pink-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MatchedUsersList;
