import React from "react";
import { Link, useNavigate } from "react-router-dom";

type NavbarType = {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUserId: React.Dispatch<React.SetStateAction<any>>;
};

const Navbar = ({ isLoggedIn, setIsLoggedIn, setUserId }: NavbarType) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserId(null);
    navigate("/");
  };

  return (
    <nav className="absolute top-0 w-full bg-gray-800 p-4 shadow-md z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold hover:text-gray-300 transition duration-300">
          Dating App
        </Link>
        <div className="space-x-4">
          {isLoggedIn ? (
            <>
              <Link
                to={`/users/${JSON.parse(localStorage.getItem("user") || "{}")._id}`}
                className="text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                Hồ Sơ
              </Link>
              <button
                onClick={handleLogout}
                className="text-white bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
              >
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                className="text-white bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-full font-medium transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50"
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
