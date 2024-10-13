import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import Cookies from 'js-cookie';

const Register = ({ setIsLoggedIn, setUserId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('');
  const [profilePictures, setProfilePictures] = useState<string[]>([]); // Chỉ định kiểu cho state
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register({ name, email, password, interests: interests.split(','), profilePictures });
      console.log('Registration successful:', data);
      setIsLoggedIn(true);
      setUserId(data.userId);
      Cookies.set('token', data.token, { expires: 1 });
      navigate('/');
    } catch (err) {
      setError('Registration failed');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setProfilePictures(files.map(file => URL.createObjectURL(file as Blob)));
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-pink-300 to-purple-300">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4">Đăng Ký</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Tên</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Mật khẩu</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Sở thích</label>
          <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className="border rounded w-full py-2 px-3" />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded py-2 px-4">Đăng Ký</button>
      </form>
    </div>
  );
};

export default Register;
