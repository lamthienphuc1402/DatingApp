import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SocketContext } from "../SocketContext";

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
          className="text-white text-2xl font-bold hover:text-gray-300 transition duration-300"
        >
          Dating App
        </Link>
        <div className="space-x-4">
          {isLoggedIn ? (
            <>
              <Link
                to={`/users/${JSON.parse(localStorage.getItem("user") || "{}")._id
                  }`}
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
              <button
                onClick={() => setShowUserLists?.(!showUserLists)}
                className="md:hidden bg-pink-500 px-2 py-2 rounded-xl font-medium text-white transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-50"
              >
                <i className={`fas ${showUserLists ? 'fa-times' : 'fa-list-ul'} text-xl`}></i>
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
