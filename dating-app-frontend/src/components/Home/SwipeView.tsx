import React, { useState, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types/user';

interface SwipeViewProps {
  users: User[];
  currentIndex: number;
  hasSwipedAllUsers: boolean;
  onLike: (userId: string) => void;
  onDislike: () => void;
  onResetSwipe: () => void;
  onSearchFarther: () => void;
}

// InfoItem component
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

const SwipeView: React.FC<SwipeViewProps> = ({
  users,
  currentIndex,
  hasSwipedAllUsers,
  onLike,
  onDislike,
  onResetSwipe,
  onSearchFarther,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (!isDragging) {
      setIsDragging(true);
      }
      setDragX(e.deltaX);
      
      // Cập nhật hướng quẹt
      if (e.deltaX > 50) {
        setSwipeDirection('right');
      } else if (e.deltaX < -50) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwipedLeft: () => {
      if (Math.abs(dragX) > 100) { // Chỉ trigger khi quẹt đủ xa
      onDislike();
      }
      resetSwipeState();
    },
    onSwipedRight: () => {
      if (Math.abs(dragX) > 100 && users[currentIndex]) { // Chỉ trigger khi quẹt đủ xa
        onLike(users[currentIndex]._id);
      }
      resetSwipeState();
    },
    onTouchEndOrOnMouseUp: () => {
      resetSwipeState();
    },
    trackMouse: true,
    trackTouch: true,
    rotationAngle: 0,
    delta: 10,
    swipeDuration: 500,
  });

  const resetSwipeState = () => {
    setIsDragging(false);
    setDragX(0);
    setSwipeDirection(null);
  };

  // Reset photo index và progress khi user thay đổi
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setProgress(0);
  }, [currentIndex, users]);

  // Auto progress cho ảnh
  useEffect(() => {
    if (!showUserDetail && users.length > 0 && currentIndex < users.length) {
      const user = users[currentIndex];
      if (user && user.profilePictures && user.profilePictures.length > 1) {
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              setCurrentPhotoIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % user.profilePictures.length;
                return nextIndex;
              });
              return 0;
            }
            return prev + (100 / 300); // 30 seconds total
          });
        }, 100);

        return () => clearInterval(interval);
      }
    }
  }, [currentIndex, users, showUserDetail]);

  // Xử lý phím mũi tên
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showUserDetail) return;

        if (e.key === "ArrowLeft") {
          onDislike();
      } else if (e.key === "ArrowRight" && users[currentIndex]) {
            onLike(users[currentIndex]._id);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, users, onDislike, onLike, showUserDetail]);

  // Lấy vị trí hiện tại của user từ localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userLocation = currentUser.location?.coordinates || [];

  // Đảm bảo currentIndex không vượt quá số lượng users
  const safeCurrentIndex = Math.min(currentIndex, users.length - 1);
  
  // Lấy user hiện tại một cách an toàn
  const userWithoutDistance = users.length > 0 && safeCurrentIndex >= 0 ? users[safeCurrentIndex] : null;

  // Tính khoảng cách cho user hiện tại
  const userWithDistance = userWithoutDistance ? {
    ...userWithoutDistance,
    distance: userLocation.length === 2 && userWithoutDistance.location?.coordinates ? 
      Number(calculateDistance(
        userLocation[1], 
        userLocation[0],
        userWithoutDistance.location.coordinates[1], 
        userWithoutDistance.location.coordinates[0]
      ).toFixed(1)) : undefined
  } : null;

  // Định dạng hiển thị khoảng cách
  const formatDistance = (distance: number | undefined) => {
    if (distance === undefined) return "Không xác định";
    if (distance < 0.1) return "Cùng khu vực";
    if (distance < 1) return "Dưới 1km";
    return `${distance}km`;
  };

  // Xử lý khi swipe hoàn tất
  const handleSwipeComplete = (direction: "left" | "right") => {
    setSwipeDirection(direction);
    
    // Đảm bảo không xử lý nếu không có user
    if (!userWithDistance) return;
    
    if (direction === 'right') {
      onLike(userWithDistance._id);
    } else {
      onDislike();
    }
    
    // Reset trạng thái sau khi swipe
    setTimeout(() => {
      setSwipeDirection(null);
      setDragX(0);
      setIsDragging(false);
    }, 300);
  };

  // Hiển thị thông báo khi đã swipe hết người dùng
  if (hasSwipedAllUsers || users.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <i className="fas fa-search text-pink-500 text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Không còn người dùng phù hợp
        </h3>
        <p className="text-gray-600 mb-8 max-w-md">
          Bạn đã xem hết tất cả người dùng phù hợp trong khu vực của mình.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onResetSwipe}
            className="px-6 py-3 bg-white text-pink-500 border border-pink-500 rounded-full hover:bg-pink-50 transition-colors"
          >
            Xem lại
          </button>
          <button
            onClick={onSearchFarther}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:opacity-90 transition-colors"
          >
            Tìm xa hơn
          </button>
        </div>
      </div>
    );
  }

  // Đảm bảo không render nếu không có user
  if (!userWithDistance) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  // Lấy ảnh hiện tại
  const currentPhoto = userWithDistance.profilePictures && userWithDistance.profilePictures.length > 0
    ? userWithDistance.profilePictures[currentPhotoIndex]
    : "/default-avatar.png";

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={userWithDistance._id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: isDragging ? dragX : 0,
            rotate: isDragging ? (dragX * 0.05) : 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 30
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            x: swipeDirection === 'left' ? -200 : swipeDirection === 'right' ? 200 : 0,
            transition: { duration: 0.3 }
          }}
          className="relative w-full sm:w-[400px] md:w-[450px] lg:w-[500px] cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e, { offset, velocity }) => {
            setIsDragging(false);
            const swipe = offset.x;
            
            if (Math.abs(swipe) > 100) {
              if (swipe > 0) {
                handleSwipeComplete('right');
              } else {
                handleSwipeComplete('left');
              }
            } else {
              // Reset dragX khi không đủ để swipe
              setDragX(0);
            }
          }}
          onDrag={(e, { offset }) => {
            setDragX(offset.x);
          }}
        >
          {/* Swipe indicators */}
          <motion.div 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-red-500/80 backdrop-blur-sm text-white p-4 rounded-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: dragX < -50 ? 1 : 0, 
              scale: dragX < -50 ? 1 : 0.5,
              x: dragX < -50 ? dragX * 0.1 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <i className="fas fa-times text-2xl"></i>
          </motion.div>
          
          <motion.div 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-blue-500/80 backdrop-blur-sm text-white p-4 rounded-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: dragX > 50 ? 1 : 0, 
              scale: dragX > 50 ? 1 : 0.5,
              x: dragX > 50 ? dragX * 0.1 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <i className="fas fa-heart text-2xl"></i>
          </motion.div>

          {/* Card content */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white">
            {/* Progress bar */}
            {userWithDistance.profilePictures && userWithDistance.profilePictures.length > 1 && (
              <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                {userWithDistance.profilePictures.map((_, index) => (
                  <div 
                    key={index} 
                    className="h-1 flex-1 bg-white/30 overflow-hidden rounded-full"
                  >
                    {index === currentPhotoIndex && (
                      <motion.div 
                        className="h-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear" }}
                      />
                    )}
                    {index < currentPhotoIndex && (
                      <div className="h-full bg-white w-full" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="aspect-[4/5] w-full overflow-hidden">
              <img
                src={currentPhoto}
                alt={users[currentIndex]?.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Navigation dots */}
            {userWithDistance.profilePictures && userWithDistance.profilePictures.length > 1 && (
              <div className="absolute bottom-[120px] left-0 right-0 flex justify-center gap-2">
                {userWithDistance.profilePictures.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPhotoIndex(index);
                      setProgress(0);
                    }}
                    className={`w-${index === currentPhotoIndex ? '8' : '2'} h-2 rounded-full transition-all ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Navigation arrows */}
            {userWithDistance.profilePictures && userWithDistance.profilePictures.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => 
                      prev === 0 
                        ? userWithDistance.profilePictures.length - 1 
                        : prev - 1
                    );
                    setProgress(0);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => 
                      (prev + 1) % userWithDistance.profilePictures.length
                    );
                    setProgress(0);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}

            {/* User info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <h2 
                    className="text-2xl font-bold text-white mb-1 cursor-pointer"
                    onClick={() => setShowUserDetail(true)}
                  >
                    {userWithDistance.name}, {userWithDistance.age}
                  </h2>
                  <p className="text-white mb-2">
                    {userWithDistance.city}, {userWithDistance.district}
                  </p>
                  {userWithDistance.distance !== undefined && (
                    <p className="flex items-center text-gray-200">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      {formatDistance(userWithDistance.distance)}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipeComplete('left');
                    }}
                    className="w-14 h-14 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <i className="fas fa-times text-red-500 text-xl"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwipeComplete('right');
                    }}
                    className="w-14 h-14 flex items-center justify-center bg-pink-500 hover:bg-pink-600 rounded-full transition-colors"
                  >
                    <i className="fas fa-heart text-white text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Bio and Interests */}
              {userWithDistance.bio && (
                <p className="text-gray-200 mt-4 line-clamp-2">{userWithDistance.bio}</p>
              )}
              {userWithDistance.interests && userWithDistance.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {userWithDistance.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* User Detail Modal */}
      {showUserDetail && userWithDistance && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              {/* Header với nút đóng */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  Thông tin chi tiết
                </h2>
                  <button
                  onClick={() => setShowUserDetail(false)}
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
                          src={userWithDistance.profilePictures[0] || "/default-avatar.png"}
                          alt={userWithDistance.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {userWithDistance.name}
                      </h2>
                      <p className="text-gray-600 mb-2">
                        {userWithDistance.email}
                      </p>
                      <div className="bg-white rounded-xl p-4 w-full mt-2">
                        <p className="text-gray-600 italic text-center">
                          "{userWithDistance.bio || "Chưa có tiểu sử"}"
                        </p>
                      </div>
                      {/* Giữ nguyên nút thích/không thích */}
                      <div className="flex gap-4 mt-6 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDislike();
                            setShowUserDetail(false);
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 px-6 rounded-full transition duration-300"
                        >
                          <i className="fas fa-times"></i>
                  </button>
                  <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLike(userWithDistance._id);
                            setShowUserDetail(false);
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
                      <InfoItem label="Tuổi" value={userWithDistance.age} />
                      <InfoItem label="Học vấn" value={userWithDistance.education} />
                      <InfoItem label="Cung hoàng đạo" value={userWithDistance.zodiacSign} />
                      <InfoItem
                        label="Giới tính"
                        value={
                          userWithDistance.gender === "male"
                            ? "Nam"
                            : userWithDistance.gender === "female"
                            ? "Nữ"
                            : "Khác"
                        }
                      />
                      <InfoItem
                        label="Xu hướng tìm kiếm"
                        value={
                          userWithDistance.genderPreference === "male"
                            ? "Nam"
                            : userWithDistance.genderPreference === "female"
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
                      {userWithDistance.interests?.map((interest, index) => (
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
                      {userWithDistance.hobbies || "Chưa cập nhật"}
                    </p>
                  </div>

                  {/* Thư viện ảnh */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
                    <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                      <i className="fas fa-images"></i>
                      Hình ảnh
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userWithDistance.profilePictures.map((pic, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedImage(pic)}
                        >
                          <img
                            src={pic}
                            alt={`${userWithDistance.name} - ${index + 1}`}
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
                        value={userWithDistance.city}
                      />
                      <InfoItem
                        label="Quận/Huyện"
                        value={userWithDistance.district}
                      />
                      <InfoItem
                        label="Khoảng cách"
                        value={formatDistance(userWithDistance.distance)}
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="relative w-full max-w-4xl">
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

export default SwipeView; 