import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "../Chat";
import MatchedUsersList from "../MatchedUsersList";
import { SocketContext } from "../../SocketContext";
import { io } from "socket.io-client";

interface User {
  profilePictures: string[];
  _id: string;
  name: string;
  email: string;
  bio?: string;
  interests?: string[];
}

export type HomeType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
};

const Home = ({ setIsLoggedIn, isLoggedIn }: HomeType) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { socket, setCurrentSocket }: any = useContext(SocketContext);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    if (token && userString) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(userString);
        fetchUserIdAndNearbyUsers(token, user._id);
      } catch (error) {
        console.error("Lỗi khi parse thông tin người dùng:", error);
        // Xử lý lỗi, ví dụ: đăng xuất người dùng
        handleLogout();
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    // Chuyển hướng người dùng về trang đăng nhập nếu cần
    // navigate("/login");
  };

  //Handle if user refresh
  useEffect(() => {
    if (!socket) {
      const user = JSON.parse(localStorage.getItem("user") || "");
      console.log(user._id);
      const refreshSocket = io(
        `${import.meta.env.VITE_LOCAL_API_URL}?userId=${user._id}`
      );
      setCurrentSocket(refreshSocket);
      setRefresh(true);
      return;
    } else {
      setRefresh(false);
    }
  }, [socket]);

  //Swipe user
  const fetchUserIdAndNearbyUsers = async (token: string, userId: string) => {
    try {
      fetchNearbyUsers(userId);
    } catch (err) {
      setError("Không thể lấy thông tin người dùng.");
    }
  };

  //Chat
  const fetchNearbyUsers = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/users/nearby/${userId}?maxDistance=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("Không thể lấy danh sách người dùng gần.");
    }
  };

  const handleLike = async (targetUserId: string) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "");
      const userId = userData._id;
      await fetch("http://localhost:3000/users/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, targetUserId }),
      });
      console.log("okay");
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } catch (err) {
      console.error("Lỗi khi thích người dùng:", err);
    }
  };

  const handleDislike = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handleSelectUser = (userId: any) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex">
      {isLoggedIn ? (
        <>
          <div className="w-1/4 bg-white p-4 overflow-y-auto">
            <MatchedUsersList
              refresh={refresh}
              onSelectUser={handleSelectUser}
            />
          </div>
          <div className="w-3/4 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-md w-full">
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {currentIndex < users.length ? (
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    {users[currentIndex].name}
                  </h2>
                  <div className="relative mb-6">
                    <img
                      src={users[currentIndex].profilePictures[0]}
                      alt={users[currentIndex].name}
                      className="w-64 h-64 object-cover rounded-full mx-auto shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full"></div>
                  </div>
                  <div className="flex justify-center space-x-4 mb-6">
                    <button
                      onClick={() => handleDislike()}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition duration-300 ease-in-out transform hover:scale-110"
                      title="Không thích"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleLike(users[currentIndex]._id)}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition duration-300 ease-in-out transform hover:scale-110"
                      title="Thích"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xl text-gray-700">
                  Không còn người dùng nào để hiển thị.
                </p>
              )}
            </div>
          </div>
          {selectedUserId && (
            <div className="fixed bottom-0 right-0 w-1/3 h-1/2 bg-white shadow-lg rounded-tl-lg overflow-hidden">
              <Chat 
                userId={(() => {
                  const userString = localStorage.getItem("user");
                  if (userString) {
                    try {
                      const user = JSON.parse(userString);
                      return user._id;
                    } catch (error) {
                      console.error("Lỗi khi parse thông tin người dùng:", error);
                      return null;
                    }
                  }
                  return null;
                })()}
                targetUserId={selectedUserId} 
                targetUserName={users.find(user => user._id === selectedUserId)?.name || "Người dùng"}
                onClose={() => setSelectedUserId(null)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="w-full flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-4xl font-bold mb-6 text-gray-800">
              Chào mừng đến với Dating App!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Khám phá những kết nối mới và tìm kiếm tình yêu đích thực của bạn.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
              >
                Đăng Ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
