import React, { useState, useEffect } from 'react';
import axios from 'axios';


const UserProfileEdit = ({ userId, onUpdate }) => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    bio: '',
    interests: '',
    profilePictures: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/users/${userId}`);
        setUserData({
          name: response.data.name,
          email: response.data.email,
          bio: response.data.bio || '',
          interests: response.data.interests.join(', ') || '',
          profilePictures: response.data.profilePictures || [],
        });
      } catch (err) {
        setError('Không thể lấy thông tin người dùng.');
      }
    };

    fetchUserData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/users/${userId}`, {
        ...userData,
        interests: userData.interests.split(',').map((interest) => interest.trim()),
      });
      onUpdate();
    } catch (err) {
      setError('Cập nhật thông tin không thành công.');
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl mb-4">Cập nhật thông tin người dùng</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Tên</label>
          <input type="text" name="name" value={userData.name} onChange={handleChange} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input type="email" name="email" value={userData.email} onChange={handleChange} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Tiểu sử</label>
          <textarea name="bio" value={userData.bio} onChange={handleChange} className="border rounded w-full py-2 px-3" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Sở thích (cách nhau bằng dấu phẩy)</label>
          <input type="text" name="interests" value={userData.interests} onChange={handleChange} className="border rounded w-full py-2 px-3" />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded py-2 px-4">Cập nhật</button>
      </form>
    </div>
  );
};


export default UserProfileEdit;

