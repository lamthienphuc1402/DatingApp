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
import MatchRecommendation from "../AI/MatchRecommendation";
import { toast } from "react-toastify";
import { User } from '../../types/user';
import Navigation from '../Navigation/Navigation';

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
  const { socket, connect, disconnect } = useContext(SocketContext);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSwipedAllUsers, setHasSwipedAllUsers] = useState(false);
  const [resetSwipe, setResetSwipe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [viewMode, setViewMode] = useState<"swipe" | "list" | "ai">("swipe");

  // Tách riêng state cho swipe và list view
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [listUsers, setListUsers] = useState<User[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");
    if (token && userString) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(userString);
        fetchNearbyUsers(user._id);
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
      if (user._id) {
        connect(user._id);
        setRefresh(true);
      }
      return;
    } else {
      setRefresh(false);
    }
  }, [socket, connect]);

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

  const fetchNearbyUsers = async (userId: string, page = 1) => {
    setError("");
    setLoading(true);

    // Kiểm tra userId
    if (!userId) {
      setError("ID người dùng không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      // Lấy thông tin tìm kiếm từ localStorage
      const savedPreferences = localStorage.getItem("searchPreferences");
      const preferences = savedPreferences
        ? JSON.parse(savedPreferences)
        : { searchDistance: 1000 };

      console.log('Fetching nearby users with preferences:', preferences);

      // Gọi API với tham số phân trang - sử dụng endpoint đúng
      const response = await fetch(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/nearby/${userId}?maxDistance=${
          preferences.searchDistance || 1000
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Kiểm tra dữ liệu trả về
      if (!data) {
        throw new Error("Dữ liệu không hợp lệ");
      }

      // Xử lý dữ liệu nhận được
      let fetchedUsers: User[] = [];
      
      if (Array.isArray(data)) {
        fetchedUsers = data;
      } else if (data.users && Array.isArray(data.users)) {
        fetchedUsers = data.users;
      } else {
        fetchedUsers = [data]; // Trường hợp trả về một user
      }
      
      console.log('Processed users:', {
        total: fetchedUsers.length,
        userIds: fetchedUsers.map(u => u._id)
      });
      
      // Lưu trữ tất cả người dùng
      setAllUsers(fetchedUsers);
      
      // Cập nhật users cho swipe view
      setUsers(fetchedUsers);
      
      // Cập nhật users cho list view với phân trang
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, fetchedUsers.length);
      setListUsers(fetchedUsers.slice(startIndex, endIndex));
      
      // Tính toán tổng số trang
      const calculatedTotalPages = Math.ceil(fetchedUsers.length / pageSize) || 1;
      setTotalPages(calculatedTotalPages);
      
      // Cập nhật trạng thái đã swipe hết người dùng
      setHasSwipedAllUsers(fetchedUsers.length === 0);
      
      // Reset index về 0 khi load dữ liệu mới
      setCurrentIndex(0);
      
      // Cập nhật trang hiện tại
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách người dùng gần:", error);
      setError(`Lỗi khi lấy danh sách người dùng gần: ${error.message || 'Không xác định'}`);
      setAllUsers([]);
      setUsers([]);
      setListUsers([]);
      setTotalPages(1);
      setHasSwipedAllUsers(true);
    } finally {
      setLoading(false);
    }
  };

  // Load more users when reaching end
  useEffect(() => {
    if (users && currentIndex > users.length - 3 && currentPage < totalPages) {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      fetchNearbyUsers(userData._id, currentPage + 1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentIndex, users?.length, totalPages]);

  const handleLike = async (targetUserId: string) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "");
      const userId = userData._id;
      
      if (!socket) {
        console.error("Socket không tồn tại");
        return;
      }
      
      // Kiểm tra nếu đã quẹt hết người dùng
      if (currentIndex >= users.length - 1 && currentPage >= totalPages) {
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
    // Đảm bảo currentIndex không vượt quá số lượng users
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setHasSwipedAllUsers(true);
    }
    toast.info("Đã bỏ qua người dùng này");
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
    fetchNearbyUsers(userData._id);
  }, []);

  // Thêm hàm để reset quẹt
  const handleResetSwipe = () => {
    setCurrentIndex(0);
    setCurrentPage(1);
    setHasSwipedAllUsers(false);
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    fetchNearbyUsers(userData._id, 1);
  };
  
  // Thêm hàm để tìm xa hơn
  const handleSearchFarther = () => {
    // Chỉ mở setting modal
    setShowSettings(true);
  };

  const renderUserDetails = () => {
    if (!selectedProfile) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Ảnh đại diện */}
            <div className="w-full h-80 bg-gray-200 relative">
              <img
                src={selectedProfile.profilePictures[0] || "/default-avatar.png"}
                alt={selectedProfile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h2 className="text-white text-3xl font-bold">
                  {selectedProfile.name}, {selectedProfile.age}
                </h2>
                <p className="text-white/80 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt"></i>
                  {selectedProfile.city}, {selectedProfile.district}
                </p>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="p-6">
              {/* Bio */}
              {selectedProfile.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Giới thiệu
                  </h3>
                  <p className="text-gray-600">{selectedProfile.bio}</p>
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Tuổi"
                    value={selectedProfile.age}
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
                    label="Học vấn"
                    value={selectedProfile.education}
                  />
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
                    value={
                      selectedProfile.distance
                        ? `${selectedProfile.distance.toFixed(1)} km`
                        : "Không xác định"
                    }
                  />
                </div>
              </div>

              {/* Sở thích */}
              {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    Sở thích
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nút like */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    handleLike(selectedProfile._id);
                    setSelectedProfile(null);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-shadow"
                >
                  <i className="fas fa-heart mr-2"></i>
                  Thích
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Hàm xử lý khi chuyển trang trong ListView
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Cập nhật listUsers dựa trên trang hiện tại
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, allUsers.length);
    setListUsers(allUsers.slice(startIndex, endIndex));
  };

  return (
    <div className="main-container">
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
      <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-400 via-pink-400 to-pink-600 flex flex-col md:flex-row">
        {/* Navigation component */}
        <Navigation 
          showUserLists={showUserLists}
          setShowUserLists={setShowUserLists}
          refresh={refresh}
          onSelectUser={handleSelectUser}
          unreadCount={unreadCount}
        />

        {/* Main content */}
        <div className="flex-1 p-4 md:px-6 lg:px-8 overflow-y-auto">
          {/* Header section */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg mb-6">
            <div className="flex items-center justify-between p-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gặp gỡ người mới
                </h1>
                <p className="text-gray-500 mt-2">
                  Khám phá những người dùng phù hợp trong khu vực của bạn
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors group relative"
                >
                  <i className="fas fa-cog text-gray-600 group-hover:rotate-90 transition-transform duration-300"></i>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Cài đặt
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* View mode selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white/95 backdrop-blur-lg rounded-xl shadow-lg p-1">
              <button
                className={`px-6 py-2.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-300 ${
                  viewMode === "swipe"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setViewMode("swipe")}
              >
                <i className="fas fa-exchange-alt"></i>
                Vuốt
              </button>
              <button
                className={`px-6 py-2.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setViewMode("list")}
              >
                <i className="fas fa-list"></i>
                Danh sách
              </button>
            </div>
          </div>

          {/* Content container */}
          <div className="transition-all duration-300 ease-in-out">
            {viewMode === "swipe" && (
              <div className="flex flex-col lg:flex-row gap-6 justify-center items-start max-w-[1600px] mx-auto">
                {/* Cột bên trái - Mẹo hẹn hò */}
                <div className="hidden lg:flex flex-col gap-6 w-[300px] xl:w-[320px] flex-shrink-0">
                  {/* Mẹo hẹn hò */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      Mẹo hẹn hò
                    </h3>
                    <p className="text-gray-600 italic">
                      "Hãy thành thật về bản thân và tìm kiếm sự kết nối thực sự thay vì chỉ tập trung vào vẻ bề ngoài."
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button className="text-purple-500 text-sm hover:underline">
                        Xem thêm mẹo
                      </button>
                    </div>
                  </div>
                  
                  {/* Thống kê ứng dụng */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-heart text-pink-500"></i>
                      Thống kê
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Người dùng online</span>
                        <span className="font-semibold text-green-500">1,245</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Kết nối hôm nay</span>
                        <span className="font-semibold text-pink-500">328</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tin nhắn đã gửi</span>
                        <span className="font-semibold text-purple-500">12,456</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hướng dẫn sử dụng */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-question-circle text-blue-500"></i>
                      Hướng dẫn
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <i className="fas fa-arrow-right text-blue-500 mt-1"></i>
                        <span>Vuốt phải để thích người dùng</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="fas fa-arrow-right text-blue-500 mt-1"></i>
                        <span>Vuốt trái để bỏ qua</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <i className="fas fa-arrow-right text-blue-500 mt-1"></i>
                        <span>Nhấn vào ảnh để xem thêm</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Cột giữa - SwipeView */}
                <div className="flex-shrink-0 mx-auto lg:mx-0">
                  <SwipeView
                    users={users}
                    currentIndex={currentIndex}
                    hasSwipedAllUsers={hasSwipedAllUsers}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onResetSwipe={handleResetSwipe}
                    onSearchFarther={handleSearchFarther}
                  />
                </div>
                
                {/* Cột bên phải - Thông tin chi tiết */}
                <div className="w-full lg:w-[320px] xl:w-[350px] flex flex-col gap-6 flex-shrink-0">
                  {/* Thống kê hoạt động */}
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <i className="fas fa-chart-line text-purple-500"></i>
                      Hoạt động của bạn
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Đã xem</span>
                        <span className="font-semibold">{currentIndex + 1}/{users.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full" 
                          style={{ width: `${users.length > 0 ? ((currentIndex + 1) / users.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      
                    </div>
                  </div>
                  
                  {/* Người dùng hiện tại */}
                  {users[currentIndex] && (
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <i className="fas fa-user text-pink-500"></i>
                          Thông tin chi tiết
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-500 text-sm">Tuổi</span>
                            <p className="font-medium">{users[currentIndex].age} tuổi</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Vị trí</span>
                            <p className="font-medium">{users[currentIndex].city}, {users[currentIndex].district}</p>
                          </div>
                          {users[currentIndex].education && (
                            <div>
                              <span className="text-gray-500 text-sm">Học vấn</span>
                              <p className="font-medium">{users[currentIndex].education}</p>
                            </div>
                          )}
                          {users[currentIndex].zodiacSign && (
                            <div>
                              <span className="text-gray-500 text-sm">Cung hoàng đạo</span>
                              <p className="font-medium">{users[currentIndex].zodiacSign}</p>
                            </div>
                          )}
                        </div>
                        
                        {users[currentIndex].interests && users[currentIndex].interests.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-500 text-sm">Sở thích</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {users[currentIndex].interests.map((interest, idx) => (
                                <span key={idx} className="bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setSelectedProfile(users[currentIndex])}
                          className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                          Xem đầy đủ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === "list" && (
              <ListView
                currentUsers={listUsers}
                onSelectProfile={setSelectedProfile}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
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

      {renderUserDetails()}

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
            fetchNearbyUsers(userData._id);
          }}
        />
      )}
    </div>
  );
};

export default Home;
