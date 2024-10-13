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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 to-pink-200 p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg text-black">
        {isEditing ? (
          <UserProfileEdit userId={user._id} onUpdate={handleUpdate} />
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-4">{user.name}</h2>
            <p className="text-lg"><strong>Email:</strong> {user.email}</p>
            <p className="text-lg"><strong>Tiểu sử:</strong> {user.bio}</p>
            <p className="text-lg"><strong>Sở thích:</strong> {user.interests?.join(', ') || 'Không có sở thích'}</p>
            <button onClick={() => setIsEditing(true)} className="mt-4 bg-blue-500 text-white rounded py-2 px-4 transition duration-300 hover:bg-blue-600">Chỉnh sửa</button>
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

