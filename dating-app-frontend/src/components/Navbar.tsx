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
    <nav className="absolute top-0 h-[80px] w-screen bg-gradient-to-r from-pink-500 to-purple-500 p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">
          Dating App
        </Link>
        <div>
          {isLoggedIn ? (
            <>
              <Link
                to={`/users/${
                  JSON.parse(localStorage.getItem("user") || "{}")._id
                }`}
                className="text-white mr-4"
              >
                Hồ Sơ
              </Link>
              <button onClick={handleLogout} className="text-white">
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white mr-4">
                Đăng Nhập
              </Link>
              <Link to="/register" className="text-white">
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
