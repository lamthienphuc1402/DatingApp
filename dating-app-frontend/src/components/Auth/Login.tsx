import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

const Login = ({ setIsLoggedIn, setUserId }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/users/login', {
        email,
        password,
      });

      if (!response.data) {
        throw new Error('Invalid email or password');
      }

      const { token, user } = response.data;
      console.log('Login successful:', response.data);

      // // Lưu token và userId vào cookie
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Cookies.set('token', token, { expires: 1 }); // Hết hạn sau 1 ngày
      // Cookies.set('userId', user._id, { expires: 1 }); // Lưu userId vào cookie

      // Cập nhật trạng thái và điều hướng
      setIsLoggedIn(true);
      setUserId(user._id);  
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-pink-300 to-purple-300">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4">Đăng Nhập</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input type="email" value={email} onChange={handleEmailChange} className="border rounded w-full py-2 px-3" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Mật khẩu</label>
          <input type="password" value={password} onChange={handlePasswordChange} className="border rounded w-full py-2 px-3" required />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded py-2 px-4">Đăng Nhập</button>
      </form>
    </div>
  );
};

export default Login;
