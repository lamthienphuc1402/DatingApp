import React, { useEffect, useState, useContext } from 'react';
import { aiService } from '../../services/aiService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { SocketContext } from '../../SocketContext';

interface UserMatch {
  _id: string;
  name: string;
  age: number;
  location: {
    type: string;
    coordinates: number[];
  };
  city: string;
  district: string;
  profilePictures?: string[];
  interests?: string[];
  compatibilityScore: number;
  distance?: number;
  bio?: string;
  zodiacSign?: string;
  education?: string;
  gender?: string;
  genderPreference?: string;
  isOnline?: boolean;
}

interface MatchRecommendationProps {
  userId: string;
  onSelectUser?: (userId: string) => void;
}

// Thêm hàm tính khoảng cách
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const MatchRecommendation: React.FC<MatchRecommendationProps> = ({ userId, onSelectUser }) => {
  const [matches, setMatches] = useState<UserMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [useAI, setUseAI] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserMatch | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const itemsPerPage = 4;
  const { socket }: any = useContext(SocketContext);

  useEffect(() => {
    if (!userId) return;
    loadRecommendations();
  }, [userId, useAI]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Lắng nghe khi có người like mình
    socket.on('receiveLike', (data: { fromUser: UserMatch }) => {
      toast.info(`${data.fromUser.name} vừa thích bạn!`, {
        position: 'bottom-left'
      });
    });

    // Lắng nghe khi match thành công
    socket.on('matchSuccess', (data: { matchedUser: UserMatch }) => {
      toast.success(`Bạn đã match với ${data.matchedUser.name}!`, {
        position: 'bottom-left'
      });
      // Refresh lại danh sách đề xuất
      loadRecommendations();
    });

    return () => {
      socket.off('receiveLike');
      socket.off('matchSuccess');
    };
  }, [socket]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await aiService.getRecommendations(userId, 12, useAI, 1);
      
      // Lấy vị trí hiện tại của user từ localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userLocation = currentUser.location?.coordinates || [];

      // Tính khoảng cách cho mỗi user được đề xuất
      const matchesWithDistance = data.map((match: UserMatch) => ({
        ...match,
        distance: userLocation.length === 2 && match.location?.coordinates ? 
          calculateDistance(
            userLocation[1], 
            userLocation[0],
            match.location.coordinates[1], 
            match.location.coordinates[0]
          ).toFixed(1) : undefined
      }));

      setMatches(matchesWithDistance);
    } catch (error) {
      console.error('Lỗi khi lấy đề xuất:', error);
      toast.error('Không thể lấy đề xuất người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (targetUserId: string) => {
    try {
      console.log('Thông tin like:', {
        userId: userId,
        targetUserId: targetUserId
      });

      // Gọi API like user
      await aiService.likeUser(userId, targetUserId);

      // Emit socket event
      const socketPayload = {
        currentUserId: userId,
        targetUserId: targetUserId,
        approveStatus: 'pending'
      };
      console.log('Socket payload:', socketPayload);
      socket.emit('sendLike', socketPayload);

      toast.success('Đã thích người này!');
    } catch (error) {
      console.error('Chi tiết lỗi khi thích người dùng:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Response error:', (error as any).response.data);
        console.error('Status code:', (error as any).response.status);
      }
      toast.error('Không thể thích người này. Vui lòng thử lại sau.');
    }
  };

  const handleViewDetail = (user: UserMatch) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleCloseDetail = () => {
    setSelectedUser(null);
    setShowUserDetail(false);
  };

  // Tính toán matches cho trang hiện tại
  const getCurrentPageMatches = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return matches.slice(startIndex, endIndex);
  };

  // Tính tổng số trang
  const totalPages = Math.ceil(matches.length / itemsPerPage);

  // Tạo mảng các số trang để hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const toggleAIMode = () => {
    setUseAI(!useAI);
  };

  const handleUserSelect = (selectedUserId: string) => {
    if (onSelectUser) {
      onSelectUser(selectedUserId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header với nút bật/tắt AI */}
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 lg:p-6 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Đề xuất Match
            </h3>
            <p className="text-gray-500 mt-1">
              Sử dụng AI để tìm người phù hợp nhất với bạn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {useAI ? "AI đang hoạt động" : "AI đã tắt"}
            </span>
            <button 
              onClick={toggleAIMode}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                useAI 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  useAI ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main content với scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center my-5 py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            <p className="mt-4 text-gray-600">Đang tìm người phù hợp...</p>
          </div>
        ) : matches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              {getCurrentPageMatches().map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-lg rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Ảnh và phần trăm phù hợp */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={user.profilePictures?.[0] || "/default-avatar.png"}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Match score */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      {Math.round(user.compatibilityScore)}% phù hợp
                    </div>

                    {/* User info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {user.name}, {user.age}
                      </h3>
                      <p className="text-white/90 text-sm flex items-center gap-2">
                        <i className="fas fa-map-marker-alt"></i>
                        {user.city}, {user.district}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin bổ sung */}
                  <div className="p-4">
                    {/* Sở thích chung */}
                    {user.interests && user.interests.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-2">Sở thích chung:</p>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.map((interest, idx) => (
                            <span 
                              key={idx}
                              className="bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Khoảng cách */}
                    {user.distance && (
                      <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-pink-500"></i>
                        Cách {user.distance}km
                      </div>
                    )}

                    {/* Nút thao tác */}
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => handleViewDetail(user)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-2"
                      >
                        Xem chi tiết
                        <i className="fas fa-arrow-right"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(user._id);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                      >
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center mb-6">
                <nav className="flex items-center gap-1 bg-white/95 backdrop-blur-lg p-2 rounded-xl shadow-sm">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg flex items-center ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <i className="fas fa-chevron-left mr-1"></i>
                    Trước
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                        page === currentPage
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                          : page === '...'
                          ? "text-gray-500 cursor-default"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg flex items-center ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Tiếp
                    <i className="fas fa-chevron-right ml-1"></i>
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 lg:py-16 bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-4xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa có đề xuất</h3>
            <p className="text-gray-600 mb-6">AI chưa tìm thấy người phù hợp với bạn</p>
            <button 
              onClick={loadRecommendations}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-2 mx-auto"
            >
              <i className="fas fa-sync-alt"></i>
              Thử lại
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
        `}
      </style>

      {/* Modal xem chi tiết */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Thông tin chi tiết
                </h2>
                <button
                  onClick={handleCloseDetail}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              {/* Cột trái - Ảnh và thông tin cơ bản */}
              <div>
                <div className="relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src={selectedUser.profilePictures?.[0] || "/default-avatar.png"}
                    alt={selectedUser.name}
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedUser.name}, {selectedUser.age}
                    </h3>
                    <p className="text-white/90 flex items-center gap-2">
                      <i className="fas fa-map-marker-alt"></i>
                      {selectedUser.city}, {selectedUser.district}
                    </p>
                  </div>
                </div>

                {/* Điểm phù hợp chi tiết */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Độ phù hợp
                    </h4>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {selectedUser.compatibilityScore}%
                    </div>
                  </div>
                  
                  {/* Các yếu tố đóng góp */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Sở thích tương đồng</span>
                        <span className="text-purple-600 font-medium">
                          {(selectedUser.interests?.length || 0) * 10}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                          style={{ width: `${(selectedUser.interests?.length || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Khoảng cách</span>
                        <span className="text-purple-600 font-medium">
                          {Math.max(0, 100 - (selectedUser.distance || 0) * 2)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                          style={{ width: `${Math.max(0, 100 - (selectedUser.distance || 0) * 2)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Độ tuổi phù hợp</span>
                        <span className="text-purple-600 font-medium">85%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải - Thông tin chi tiết */}
              <div>
                {/* Lý do đề xuất */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
                  <h4 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    <i className="fas fa-robot mr-2"></i>
                    Lý do AI đề xuất
                  </h4>
                  <div className="space-y-4">
                    {selectedUser.interests && selectedUser.interests.length > 0 && (
                      <div className="flex items-start gap-3 bg-white/50 rounded-xl p-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                          <i className="fas fa-heart"></i>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">Sở thích tương đồng</h5>
                          <p className="text-gray-600 mt-1">
                            Có <span className="font-medium text-purple-600">{selectedUser.interests.length} sở thích</span> chung: {selectedUser.interests.join(", ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedUser.distance && (
                      <div className="flex items-start gap-3 bg-white/50 rounded-xl p-4">
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
                          <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">Khoảng cách lý tưởng</h5>
                          <p className="text-gray-600 mt-1">
                            Cách bạn <span className="font-medium text-pink-600">{selectedUser.distance}km</span> - trong phạm vi phù hợp
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 bg-white/50 rounded-xl p-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                        <i className="fas fa-user"></i>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">Thông tin cá nhân</h5>
                        <p className="text-gray-600 mt-1">
                          Độ tuổi và giới tính phù hợp với sở thích của bạn
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin cơ bản */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                  <h4 className="font-medium text-gray-800 mb-4">Giới thiệu</h4>
                  <p className="text-gray-600">{selectedUser.bio || "Chưa có giới thiệu"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Cung hoàng đạo</h4>
                    <p className="text-gray-600">{selectedUser.zodiacSign || "Chưa cập nhật"}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Học vấn</h4>
                    <p className="text-gray-600">{selectedUser.education || "Chưa cập nhật"}</p>
                  </div>
                </div>

                {/* Sở thích */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
                  <h4 className="font-medium text-gray-800 mb-4">Sở thích</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests?.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-4 py-2 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nút thao tác */}
                <button
                  onClick={() => {
                    handleLike(selectedUser._id);
                    handleCloseDetail();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <i className="fas fa-heart"></i>
                  Thích người này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchRecommendation; 