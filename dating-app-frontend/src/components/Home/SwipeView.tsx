import React, { useState, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';

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

interface SwipeViewProps {
  users: User[];
  currentIndex: number;
  hasSwipedAllUsers: boolean;
  onLike: (userId: string) => void;
  onDislike: () => void;
  onResetSwipe: () => void;
  onSearchFarther: () => void;
}

const SwipeView: React.FC<SwipeViewProps> = ({
  users,
  currentIndex,
  hasSwipedAllUsers,
  onLike,
  onDislike,
  onResetSwipe,
  onSearchFarther,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [storyTimer, setStoryTimer] = useState<NodeJS.Timeout | null>(null);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsDragging(true);
      setDragX(e.deltaX);
    },
    onSwipedLeft: () => {
      onDislike();
    },
    onSwipedRight: () => {
      if (users[currentIndex]) {
        onLike(users[currentIndex]._id);
      }
    },
    onSwiped: () => {
      setIsDragging(false);
      setDragX(0);
    },
    trackMouse: true,
  });

  // Reset photo index khi chuyển user
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentIndex]);

  // Hàm xử lý tự động chuyển ảnh sau 45s
  const startStoryTimer = useCallback(() => {
    if (storyTimer) clearTimeout(storyTimer);

    const timer = setTimeout(() => {
      const user = users[currentIndex];
      if (user && currentPhotoIndex < user.profilePictures.length - 1) {
        setCurrentPhotoIndex((prev) => prev + 1);
      }
    }, 45000); // 45 seconds

    setStoryTimer(timer);
  }, [currentIndex, currentPhotoIndex, users]);

  // Reset và start timer khi chuyển ảnh hoặc user
  useEffect(() => {
    startStoryTimer();
    return () => {
      if (storyTimer) clearTimeout(storyTimer);
    };
  }, [currentPhotoIndex, currentIndex, startStoryTimer]);

  // Thêm effect để xử lý phím mũi tên
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (users.length > 0) {
        if (e.key === "ArrowLeft") {
          onDislike();
        } else if (e.key === "ArrowRight") {
          if (users[currentIndex]) {
            onLike(users[currentIndex]._id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, users, onDislike, onLike]);

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Không có người dùng nào trong khu vực của bạn
        </p>
      </div>
    );
  }

  if (hasSwipedAllUsers) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <i className="fas fa-search text-5xl text-pink-500 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Đã hết người dùng gần đây</h3>
          <p className="text-gray-600 mb-6">Bạn đã xem hết tất cả người dùng trong khu vực của mình.</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={onSearchFarther}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 transition duration-300 shadow-md"
            >
              <i className="fas fa-globe-asia mr-2"></i> Tìm xa hơn
            </button>
            
            <button 
              onClick={onResetSwipe}
              className="w-full py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-300"
            >
              <i className="fas fa-redo mr-2"></i> Xem lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="relative h-[600px]" {...handlers}>
        {users.map((user, index) => (
          <div
            key={user._id}
            className={`absolute inset-0 transition-all duration-300 ${
              index === currentIndex ? "z-10" : "z-0"
            }`}
            style={{
              transform:
                index === currentIndex
                  ? `scale(1) translateX(${
                      isDragging ? dragX : 0
                    }px) rotate(${isDragging ? dragX * 0.1 : 0}deg)`
                  : "scale(0.95)",
              opacity: index === currentIndex ? 1 : 0,
              transition: isDragging ? "none" : "all 0.3s ease-out",
            }}
          >
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Stories Progress Bar */}
              <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 bg-gradient-to-b from-black/50 to-transparent">
                {user.profilePictures.map((_, photoIndex) => (
                  <div
                    key={photoIndex}
                    className="h-1 flex-1 rounded-full overflow-hidden bg-white/30"
                  >
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{
                        width:
                          photoIndex <= currentPhotoIndex
                            ? "100%"
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Main Photo Container */}
              <div className="relative aspect-[3/4]">
                {user.profilePictures.map((photo, photoIndex) => (
                  <img
                    key={photoIndex}
                    src={photo || "https://via.placeholder.com/150"}
                    alt={`${user.name} - ${photoIndex + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      photoIndex === currentPhotoIndex
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                ))}

                {/* Photo Navigation Tap Areas */}
                <div className="absolute inset-0 flex">
                  <div
                    className="w-1/2 h-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentPhotoIndex > 0) {
                        setCurrentPhotoIndex((prev) => prev - 1);
                        startStoryTimer();
                      }
                    }}
                  />
                  <div
                    className="w-1/2 h-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const maxIndex =
                        users[currentIndex]?.profilePictures
                          .length - 1;
                      if (currentPhotoIndex < maxIndex) {
                        setCurrentPhotoIndex((prev) => prev + 1);
                        startStoryTimer();
                      }
                    }}
                  />
                </div>

                {/* User Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-2xl font-bold text-white">
                    {user.name}, {user.age}
                  </h3>
                  <p className="text-white/80">{user.bio}</p>
                </div>
              </div>

              {/* Rest of the card content */}
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.interests?.slice(0, 3).map((interest, i) => (
                    <span
                      key={i}
                      className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => onDislike()}
                    className="w-14 h-14 flex items-center justify-center bg-white border-2 border-red-500 text-red-500 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                  <button
                    onClick={() => onLike(user._id)}
                    className="w-14 h-14 flex items-center justify-center bg-white border-2 border-green-500 text-green-500 rounded-full hover:bg-green-50 transition-colors"
                  >
                    <i className="fas fa-heart text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwipeView; 