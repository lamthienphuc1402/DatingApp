import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

interface UserData {
  name: string;
  email: string;
  bio: string;
  interests: string;
  profilePictures: string[];
}

const UserProfileEdit = ({ userId, onUpdate }) => {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    bio: '',
    interests: '',
    profilePictures: [],
  });
  const [error, setError] = useState('');
  const [newProfilePictures, setNewProfilePictures] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewProfilePictures(files);

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('bio', userData.bio);
      formData.append('interests', userData.interests.split(',').map(interest => interest.trim()).toString());
      
      newProfilePictures.forEach((file) => {
        formData.append('profilePictures', file);
      });

      await axios.put(`http://localhost:3000/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUpdate();
    } catch (err) {
      setError('Cập nhật thông tin không thành công.');
    }
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Cập nhật thông tin</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center mb-6">
          <img 
            src={previewUrls[0] || userData.profilePictures[0] || 'https://via.placeholder.com/150'} 
            alt={userData.name} 
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 mr-6"
          />
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              multiple
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
        </div>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-md"
              />
            ))}
          </div>
        )}

        <div className="bg-purple-100 rounded-xl p-6 mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-purple-800 mb-1">Tên</label>
          <input
            type="text"
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white text-black border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div className="bg-pink-100 rounded-xl p-6 mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-pink-800 mb-1">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white text-black border border-pink-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div className="bg-purple-100 rounded-xl p-6 mb-6">
          <label htmlFor="bio" className="block text-sm font-medium text-purple-800 mb-1">Tiểu sử</label>
          <textarea
            id="bio"
            name="bio"
            value={userData.bio}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white text-black border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={4}
          ></textarea>
        </div>

        <div className="bg-pink-100 rounded-xl p-6 mb-6">
          <label htmlFor="interests" className="block text-sm font-medium text-pink-800 mb-1">Sở thích (cách nhau bằng dấu phẩy)</label>
          <input
            type="text"
            id="interests"
            name="interests"
            value={userData.interests}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white text-black border border-pink-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          Cập nhật
        </button>
      </form>
    </div>
  );
};

export default UserProfileEdit;
