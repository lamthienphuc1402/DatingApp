import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext } from "../SocketContext";
import ICO from "/images/ICO.png";

type NavbarType = {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUserId: React.Dispatch<React.SetStateAction<any>>;
  showUserLists: boolean;
  setShowUserLists: React.Dispatch<React.SetStateAction<boolean>>;
};

const Navbar = ({ isLoggedIn, setIsLoggedIn, setUserId, showUserLists, setShowUserLists }: NavbarType) => {
  const navigate = useNavigate();
  const { socket }: any = useContext(SocketContext);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserId(null);
    socket.disconnect();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-800 p-4 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-white text-lg sm:text-2xl font-bold hover:text-gray-300 transition duration-300 flex items-center gap-1 sm:gap-2"
        >
          <img src={ICO} alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="hidden sm:inline">Dating App</span>
          <span className="sm:hidden">Dating</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to={`/users/${JSON.parse(localStorage.getItem("user") || "{}")._id}`}
                className="text-white bg-pink-500 hover:bg-pink-600 px-3 py-1.5 text-sm rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                <i className="fas fa-user sm:mr-2"></i>
                <span className="hidden sm:inline">Hồ Sơ</span>
              </Link>
              <Link
                to="/ai"
                className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-3 py-1.5 text-sm rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 flex items-center gap-2"
              >
                <i className="fas fa-robot"></i>
                <span className="hidden sm:inline">AI Đề xuất</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white bg-purple-500 hover:bg-purple-600 px-3 py-1.5 text-sm rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
              >
                <i className="fas fa-sign-out-alt sm:mr-2"></i>
                <span className="hidden sm:inline">Đăng Xuất</span>
              </button>
              <button
                onClick={() => setShowUserLists?.(!showUserLists)}
                className="md:hidden bg-pink-500 hover:bg-pink-600 px-2 py-1 rounded-full text-white transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                <i className={`fas ${showUserLists ? 'fa-times' : 'fa-comments'} text-lg`}></i>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white bg-pink-500 hover:bg-pink-600 px-3 py-1.5 text-sm rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="text-white bg-purple-500 hover:bg-purple-600 px-3 py-1.5 text-sm rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
              >
                Đăng Ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
