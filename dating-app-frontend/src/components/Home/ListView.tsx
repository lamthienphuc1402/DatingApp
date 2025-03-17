import React from 'react';
import { User } from '../../types/user';
import { motion } from 'framer-motion';

interface ListViewProps {
  currentUsers: User[];
  onSelectProfile: (user: User) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ListView: React.FC<ListViewProps> = ({ 
  currentUsers, 
  onSelectProfile, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  // Tạo mảng các số trang để hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Số lượng nút trang tối đa hiển thị
    
    if (totalPages <= maxPagesToShow) {
      // Nếu tổng số trang ít hơn hoặc bằng số trang tối đa, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu tiên
      pageNumbers.push(1);
      
      // Tính toán phạm vi trang cần hiển thị
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Điều chỉnh nếu đang ở gần đầu hoặc cuối
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Thêm dấu ... nếu cần
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Thêm các trang ở giữa
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Thêm dấu ... nếu cần
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Luôn hiển thị trang cuối cùng
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {currentUsers.map((user, index) => (
          <motion.div
            key={user._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSelectProfile(user)}
            className="bg-white/95 backdrop-blur-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer group"
          >
            {/* Ảnh đại diện với hiệu ứng hover */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={user.profilePictures[0] || "/default-avatar.png"}
                alt={user.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Match score */}
              <div className="absolute top-4 right-4 bg-pink-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {user.matchScore}% phù hợp
              </div>

              {/* Online status */}
              {user.isOnline && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Trực tuyến
                </div>
              )}
            </div>

            {/* Thông tin người dùng */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {user.name}, {user.age}
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <i className="fas fa-map-marker-alt"></i>
                    {user.city}, {user.district}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {user.bio ? (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4 italic">
                  "{user.bio}"
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic mb-4">
                  Chưa có tiểu sử
                </p>
              )}

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.interests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.interests.length > 3 && (
                    <span className="text-gray-400 text-xs flex items-center">
                      +{user.interests.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10">
          <nav className="flex items-center gap-1 bg-white/95 backdrop-blur-lg p-3 rounded-xl shadow-md">
            {/* Nút Previous */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg flex items-center ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className="fas fa-chevron-left mr-1"></i>
              <span className="hidden sm:inline">Trước</span>
            </button>

            {/* Các nút số trang */}
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  page === currentPage
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-md"
                    : page === '...'
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            {/* Nút Next */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg flex items-center ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="hidden sm:inline">Tiếp</span>
              <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ListView; 