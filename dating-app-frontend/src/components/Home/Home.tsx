import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "../Chat";
import UserLists from "../UserLists";
import { SocketContext } from "../../SocketContext";
import { io } from "socket.io-client";
import ApproveModal from "./ApproveModal.tsx";
import ApproveNotice from "./ApproveNotice.tsx";
import LocationUpdateModal from "../LocationUpdateModal";
import axios from "axios";
import SearchSettings from "../Settings/SearchSettings.tsx";

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
  gender: "male" | "female" | "other";
  genderPreference: "male" | "female" | "both";
  city?: string;
  district?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  matchScore?: number;
}
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

export type HomeType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  showUserLists: boolean;
  setShowUserLists: React.Dispatch<React.SetStateAction<boolean>>;
};

const Home = ({
  setIsLoggedIn,
  isLoggedIn,
  showUserLists,
  setShowUserLists,
}: HomeType) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState("");
  const [currentFromId, setCurrentFromId] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { socket, setCurrentSocket }: any = useContext(SocketContext);
  const [showSettings, setShowSettings] = useState(false);

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = window.innerWidth > 1280 ? 8 : 6;

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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

  useEffect(() => {
    if (!socket) return;
    const user = JSON.parse(localStorage.getItem("user") || "");

    socket.on("matchApprove", (data: any) => {
      const matchData = JSON.parse(data);
      setCurrentMatchId(matchData.targetUserId);
      setCurrentFromId(matchData.fromUserId);
      if (matchData.targetUserId === user._id) {
        const modal: any = document.querySelector("#approveBox");
        if (modal) modal.showModal();
        return;
      }
    });

    socket.on("matchStatus", (data: any) => {
      const approveModal: any = document.querySelector("#approveBox");
      if (approveModal) approveModal.close();
      const matchData = JSON.parse(data);
      if (
        matchData.targetUserId === user._id ||
        matchData.fromUserId === user._id
      ) {
        const modal: any = document.querySelector("#notice");
        if (modal) modal.showModal();
        return;
      }
    });
    return () => {
      socket.off("matchApprove");
      socket.off("sendLike");
      socket.off("matchStatus");
    };
  }, [socket]);

  //Swipe user
  const fetchUserIdAndNearbyUsers = async (_token: string, userId: string) => {
    try {
      fetchNearbyUsers(userId);
    } catch (err) {
      setError("Không thể lấy thông tin người dùng.");
    }
  };

  //Chat
  const fetchNearbyUsers = async (userId: string) => {
    try {
      const savedPrefs = localStorage.getItem("searchPreferences");
      const preferences = savedPrefs
        ? JSON.parse(savedPrefs)
        : { searchDistance: 1000 };

      const response = await fetch(
        `http://localhost:3000/users/nearby/${userId}?maxDistance=${preferences.searchDistance}`,
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
      setCurrentIndex((prevIndex) => prevIndex + 1);
      socket.emit("sendLike", {
        currentUserId: userId,
        targetUserId,
        approveStatus: "pending",
      });
    } catch (err) {
      console.error("Lỗi khi thích người dùng:", err);
    }
  };

  const handleDislike = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handleSelectUser = (userId: string) => {
    const user = users.find((user) => user._id === userId);
    if (user) {
      setSelectedUser(user);
    } else {
      console.error("Không tìm thấy người dùng với ID:", userId);
    }
  };

  useEffect(() => {
    if (showUserLists) {
      document.body.classList.add("user-lists-open");
    } else {
      document.body.classList.remove("user-lists-open");
    }

    return () => {
      document.body.classList.remove("user-lists-open");
    };
  }, [showUserLists]);

  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const checkUserLocation = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const response = await axios.get(
          `http://localhost:3000/users/${userData._id}`
        );
        if (!response.data.city || !response.data.district) {
          setShowLocationModal(true);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra vị trí:", err);
      }
    };
    checkUserLocation();
  }, []);

  return (
    <>
      <ApproveNotice
        socket={socket}
        fromUserName={currentFromId}
        toUserName={currentMatchId}
      />
      <ApproveModal
        socket={socket}
        fromUser={currentFromId}
        targetUser={currentMatchId}
      />
      <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-400 via-pink-400 to-pink-600 flex relative">
        {/* UserLists container với responsive classes */}
        <div
          className={`
                    fixed md:relative
                    w-full md:w-1/3
                    h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4rem)] 
                    bg-white
                    transition-all duration-300 ease-in-out
                    user-lists-sidebar
                    ${showUserLists ? "right-0" : "-right-full md:right-0"}
                    z-40 md:z-auto
                    overflow-hidden
                `}
        >
          <UserLists
            refresh={refresh}
            onSelectUser={handleSelectUser}
            onClose={() => setShowUserLists(false)}
          />
        </div>

        {/* Main content */}
        <div className="w-full md:w-2/3 p-4">
          {/* Header section with improved layout */}
          <div className="bg-white rounded-xl shadow-lg mb-8">
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-gray-800">
                  Gặp gỡ người mới
                </h1>
                <p className="text-gray-500 mt-1">
                  Khám phá những người dùng phù hợp trong khu vực của bạn
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Settings button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <i className="fas fa-cog text-gray-600"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Modal - keeping existing code */}
          {showSettings && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-modal-slide-up">
                {/* Close button */}
                <button
                  onClick={() => setShowSettings(false)}
                  className="absolute right-4 top-4 z-10 p-2 bg-white hover:bg-gray-100/10 rounded-full transition-colors"
                >
                  <i className="fas fa-times text-xl text-gray-600"></i>
                </button>

                {/* SearchSettings component */}
                <SearchSettings onClose={() => setShowSettings(false)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {currentUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedProfile(user)}
                className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <div className="flex flex-col items-center">
                  <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-full text-sm">
                    {user.matchScore}% phù hợp
                  </div>
                  <img
                    src={
                      user.profilePictures[0] ||
                      "https://via.placeholder.com/150"
                    }
                    alt={user.name}
                    className="w-32 h-32 object-cover rounded-full border-4 border-pink-200 mb-4"
                  />
                  {user.age && (
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {user.name}, {user.age}
                    </h3>
                  )}
                  {!user.age && (
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {user.name}
                    </h3>
                  )}
                  {user.bio && (
                    <p className="text-gray-600 text-sm text-center line-clamp-3 mb-3">
                      {user.bio}
                    </p>
                  )}
                  {!user.bio && (
                    <p className="text-gray-400 text-sm italic text-center mb-3">
                      Chưa có tiểu sử
                    </p>
                  )}
                </div>

                {user.interests && user.interests.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {user.interests.slice(0, 3).map((interest, index) => (
                      <span
                        key={index}
                        className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full"
                      >
                        {interest}
                      </span>
                    ))}
                    {user.interests.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{user.interests.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page
                    ? "bg-gray-800 text-white"
                    : "bg-white text-pink-500 hover:bg-pink-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

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
                  {/* Header với nút đóng */}
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
                          <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border-4 border-white shadow-lg overflow-hidden mb-4">
                            <img
                              src={
                                selectedProfile.profilePictures[0] ||
                                "https://via.placeholder.com/150"
                              }
                              alt={selectedProfile.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
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
                          {/* Giữ nguyên nút thích/không thích */}
                          <div className="flex gap-4 mt-6 w-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDislike();
                                setSelectedProfile(null);
                              }}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-6 rounded-full transition duration-300"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(selectedProfile._id);
                                setSelectedProfile(null);
                              }}
                              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-full transition duration-300"
                            >
                              <i className="fas fa-heart"></i>
                            </button>
                          </div>
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
                          <InfoItem
                            label="Học vấn"
                            value={selectedProfile.education}
                          />
                          <InfoItem
                            label="Cung hoàng đạo"
                            value={selectedProfile.zodiacSign}
                          />
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

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
                        <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
                          <i className="fas fa-map-marker-alt"></i>
                          Vị trí
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <InfoItem
                            label="Thành phố"
                            value={selectedProfile.city}
                          />
                          <InfoItem
                            label="Quận/Huyện"
                            value={selectedProfile.district}
                          />
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
                onClick={(event) => event.stopPropagation()}
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
      </div>

      {/* Overlay để đóng UserLists khi click bên ngoài */}
      {showUserLists && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setShowUserLists(false)}
        />
      )}

      {showLocationModal && (
        <LocationUpdateModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </>
  );
};

export default Home;
