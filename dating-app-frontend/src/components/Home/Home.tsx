import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chat from "../Chat";

interface User {
  profilePictures: string[];
  _id: string;
  name: string;
  email: string;
  bio?: string;
  interests?: string[];
}

export type HomeType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
};

const Home = ({ setIsLoggedIn, isLoggedIn }: HomeType) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserIdAndNearbyUsers(token);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const fetchUserIdAndNearbyUsers = async (token: string) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "");

      if (!userData || !userData._id) {
        throw new Error("Không thể lấy thông tin người dùng.");
      }

      const userId = userData._id; // Lấy userId từ thông tin người dùng
      fetchNearbyUsers(userId);
    } catch (err) {
      setError("Không thể lấy thông tin người dùng.");
    }
  };

  const fetchNearbyUsers = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/users/nearby/${userId}?maxDistance=1000`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("Không thể lấy danh sách người dùng gần.");
    }
  };

  const handleLike = async (targetUserId: string) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "");
      const userId = userData._id;
      await fetch("http://localhost:3000/users/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, targetUserId }),
      });
      console.log("okay");
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } catch (err) {
      console.error("Lỗi khi thích người dùng:", err);
    }
  };

  const handleDislike = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
  };

  const handleChat = (userId: any) => {
    setTargetUserId(userId);
    setIsChatOpen(true);
  };

  return (
    <div className="container mx-auto p-6 w-full bg-gradient-to-b from-purple-200 to-blue-200">
      {error && <p className="text-red-500">{error}</p>}
      {!isLoggedIn ? (
        <div className="text-center">
          <h1 className="text-3xl font-bold">Chào mừng đến với Dating App!</h1>
          <p className="mt-4">
            Kết nối với những người bạn mới và tìm kiếm tình yêu của bạn.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 bg-blue-500 text-white rounded py-2 px-4"
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => navigate("/register")}
            className="mt-2 bg-green-500 text-white rounded py-2 px-4"
          >
            Đăng Ký
          </button>
        </div>
      ) : currentIndex < users.length ? (
        <div className="border p-4 mb-4 rounded shadow-md bg-white text-black">
          <h2 className="text-xl">{users[currentIndex].name}</h2>
          <img
            src={users[currentIndex].profilePictures[0]}
            alt={users[currentIndex].name}
            className="w-20 h-20 object-cover rounded-full mr-2"
          />
          <button
            onClick={() => handleLike(users[currentIndex]._id)}
            className="bg-blue-500 text-white rounded py-1 px-2 mr-2"
          >
            Thích
          </button>
          <button
            onClick={handleDislike}
            className="bg-red-500 text-white rounded py-1 px-2"
          >
            Không Thích
          </button>
          <button
            onClick={() => handleChat(users[currentIndex]._id)}
            className="bg-green-500 text-white rounded py-1 px-2 ml-2"
          >
            Chat
          </button>
        </div>
      ) : (
        <p>Không còn người dùng nào để hiển thị.</p>
      )}
      {isChatOpen && (
        <Chat
          userId={JSON.parse(localStorage.getItem("user") || "{}")._id ?? ""}
          targetUserId={targetUserId}
        />
      )}
    </div>
  );
};

export default Home;
