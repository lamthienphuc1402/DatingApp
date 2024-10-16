import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfileEdit from './UserProfileEdit.tsx';
import { useParams } from 'react-router-dom';

interface User {
  profilePictures: string[];
  _id: string;
  name: string;
  email: string;
  bio?: string;
  interests?: string[];
}

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError('Không thể lấy thông tin người dùng.');
      }
    };

    fetchUserData();
  }, [userId]);

  const handleUpdate = () => {
    setIsEditing(false);
    fetchUserData();
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!user) {
    return <p>Đang tải thông tin người dùng...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {isEditing ? (
          <UserProfileEdit userId={user._id} onUpdate={handleUpdate} />
        ) : (
          <>
            <div className="flex items-center mb-6">
              <img 
                src={user.profilePictures?.[0] || 'https://via.placeholder.com/150'} 
                alt={user.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 mr-6"
              />
              <div>
                <h2 className="text-4xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-lg text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="bg-purple-100 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-2 text-purple-800">Tiểu sử</h3>
              <p className="text-lg text-gray-700">{user.bio || 'Chưa có thông tin tiểu sử.'}</p>
            </div>
            
            <div className="bg-pink-100 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-2 text-pink-800">Sở thích</h3>
              {user.interests && user.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <span key={index} className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-lg text-gray-700">Chưa có thông tin về sở thích.</p>
              )}
            </div>
            
            <div className="bg-red-100 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold mb-2 text-red-800">Hình ảnh</h3>
              <div className="grid grid-cols-3 gap-4">
                {user.profilePictures && user.profilePictures.length > 0 ? (
                  user.profilePictures.map((pic, index) => (
                    <img key={index} src={pic} alt={`Ảnh ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  ))
                ) : (
                  <p className="text-lg text-gray-700 col-span-3">Chưa có hình ảnh.</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditing(true)} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Chỉnh sửa hồ sơ
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
function fetchUserData() {
  throw new Error('Function not implemented.');
}
