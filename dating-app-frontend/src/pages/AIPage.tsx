import React, { useState, useCallback } from 'react';
import MatchRecommendation from '../components/AI/MatchRecommendation';
import Navigation from '../components/Navigation/Navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePictures?: string[];
  // thêm các field khác nếu cần
}

interface AIPageProps {
  showUserLists: boolean;
  setShowUserLists: React.Dispatch<React.SetStateAction<boolean>>;
}

const AIPage: React.FC<AIPageProps> = ({ showUserLists, setShowUserLists }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSelectUser = useCallback((userId: string) => {
    // Xử lý khi chọn user từ danh sách
    console.log('Selected user:', userId);
  }, []);

  const handleAIUserSelect = useCallback((userId: string) => {
    // Tìm user từ API hoặc cache và set vào state
    console.log('Selected AI user:', userId);
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-400 via-pink-400 to-pink-600 flex flex-col md:flex-row">
      {/* Navigation */}
      <Navigation
        showUserLists={showUserLists}
        setShowUserLists={setShowUserLists}
        onSelectUser={handleSelectUser}
      />

      {/* Main content */}
      <div className="flex-1 p-4 md:px-6 lg:px-8">
        

        {/* AI Recommendations */}
        <MatchRecommendation
          userId={JSON.parse(localStorage.getItem('user') || '{}')._id}
          onSelectUser={handleAIUserSelect}
        />
      </div>
    </div>
  );
};

export default AIPage; 