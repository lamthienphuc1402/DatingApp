import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserLists from "../UserLists";
import { SocketContext } from "../../SocketContext";
import { io } from "socket.io-client";
import ApproveModal from "./ApproveModal.tsx";
import ApproveNotice from "./ApproveNotice.tsx";
import LocationUpdateModal from "../LocationUpdateModal";
import axios from "axios";
import SearchSettings from "../Settings/SearchSettings.tsx";
import ListView from "./ListView";
import SwipeView from "./SwipeView";

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
  distance?: number;
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
  const [hasSwipedAllUsers, setHasSwipedAllUsers] = useState(false);
  const [resetSwipe, setResetSwipe] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = window.innerWidth > 1280 ? 8 : 6;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);
  const [viewMode, setViewMode] = useState<"swipe" | "list">("list");

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
        `${
          import.meta.env.VITE_LOCAL_API_URL
        }/users/nearby/${userId}?maxDistance=${preferences.searchDistance}`,
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
      
      // Kiểm tra nếu đã quẹt hết người dùng
      if (currentIndex >= users.length - 1) {
        setHasSwipedAllUsers(true);
      } else {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }
      
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
    // Kiểm tra nếu đã quẹt hết người dùng
    if (currentIndex >= users.length - 1) {
      setHasSwipedAllUsers(true);
    } else {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
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
          `${import.meta.env.VITE_LOCAL_API_URL}/users/${userData._id}`
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

  const handleSettingsChanged = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    fetchUserIdAndNearbyUsers(localStorage.getItem("token") || "", userData._id);
  }, []);

  // Thêm hàm để reset quẹt
  const handleResetSwipe = () => {
    setCurrentIndex(0);
    setHasSwipedAllUsers(false);
    setResetSwipe(prev => !prev);
  };
  
  // Thêm hàm để tìm xa hơn
  const handleSearchFarther = () => {
    const savedPrefs = localStorage.getItem("searchPreferences");
    const preferences = savedPrefs
      ? JSON.parse(savedPrefs)
      : { searchDistance: 1000 };
    
    // Tăng khoảng cách tìm kiếm lên 50%
    const newDistance = preferences.searchDistance * 3;
    const newPrefs = { ...preferences, searchDistance: newDistance };
    
    localStorage.setItem("searchPreferences", JSON.stringify(newPrefs));
    
    // Fetch lại danh sách người dùng
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    fetchUserIdAndNearbyUsers(localStorage.getItem("token") || "", userData._id);
    
    // Reset trạng thái
    setHasSwipedAllUsers(false);
    setCurrentIndex(0);
  };

  // Thêm hàm xử lý chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Header section with improved layout */}
          <div className="bg-white rounded-xl shadow-lg mb-4">
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
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`text-xs sm:text-sm ${
                      viewMode === "list" ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    <i className="fas fa-th-large mr-1 hidden sm:inline"></i>
                    <span className="sm:hidden">Danh sách</span>
                    <span className="hidden sm:inline">Danh sách</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={viewMode === "swipe"}
                      onChange={() =>
                        setViewMode((prev) =>
                          prev === "list" ? "swipe" : "list"
                        )
                      }
                    />
                    <div className="w-12 sm:w-14 h-6 sm:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                  <span
                    className={`text-xs sm:text-sm ${
                      viewMode === "swipe" ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    <i className="fas fa-hand-pointer mr-1 hidden sm:inline"></i>
                    <span className="sm:hidden">Quẹt</span>
                    <span className="hidden sm:inline">Quẹt</span>
                  </span>
                </div>

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

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                {/* Thêm nút đóng ở góc trên bên phải */}
                <button
                  onClick={() => setShowSettings(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition duration-300 z-10"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>

                <SearchSettings
                  onClose={() => setShowSettings(false)}
                  onSettingsChanged={handleSettingsChanged}
                />
              </div>
            </div>
          )}

          {/* Sử dụng các component mới */}
          {viewMode === "list" ? (
            <ListView 
              currentUsers={currentUsers} 
              onSelectProfile={setSelectedProfile} 
            />
          ) : (
            <SwipeView
              users={users}
              currentIndex={currentIndex}
              hasSwipedAllUsers={hasSwipedAllUsers}
              onLike={handleLike}
              onDislike={handleDislike}
              onResetSwipe={handleResetSwipe}
              onSearchFarther={handleSearchFarther}
            />
          )}

          {/* Chỉ hiển thị phân trang khi ở chế độ danh sách */}
          {viewMode === "list" && (
            <div className="flex justify-center mt-3 2xl:mt-6 gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* User Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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
                        <InfoItem
                          label="Khoảng cách"
                          value={`${selectedProfile.distance ? selectedProfile.distance.toFixed(1) : '?'} km`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              >
                <i className="fas fa-times"></i>
              </button>
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>
          </div>
        )}

        {/* Location Update Modal */}
        {showLocationModal && (
          <LocationUpdateModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onLocationUpdated={() => {
              setShowLocationModal(false);
              // Refresh user list after location update
              const userData = JSON.parse(localStorage.getItem("user") || "{}");
              fetchUserIdAndNearbyUsers(
                localStorage.getItem("token") || "",
                userData._id
              );
            }}
          />
        )}
      </div>
    </>
  );
};

export default Home;
