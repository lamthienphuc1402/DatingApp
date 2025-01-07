import React, { useState, useEffect } from "react";
import axios from "axios";
import UserProfileEdit from "./UserProfileEdit";

interface UserData {
  _id: string;
  name: string;
  email: string;
  bio: string;
  interests: string[];
  profilePictures: string[];
  age: number;
  zodiacSign: string;
  education: string;
  hobbies: string;
  gender: "male" | "female" | "other";
  genderPreference: "male" | "female" | "both";
  city?: string;
  district?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
}

const UserProfile = ({ setIsLoggedIn }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState("");

  const fetchUserData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User data từ localStorage:", userData);

      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/${userData._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Dữ liệu mới từ server:", response.data);
      setUser(response.data);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      setError("Không thể lấy thông tin người dùng.");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    console.log("Bắt đầu cập nhật...");
    try {
      await fetchUserData();
      console.log("Đã fetch dữ liệu mới");
      setIsEditing(false);
    } catch (err) {
      console.error("Lỗi trong handleUpdate:", err);
    }
  };

  if (!user) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto backdrop-blur-sm">
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          {isEditing ? (
            <UserProfileEdit userId={user._id} onUpdate={handleUpdate} />
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative group">
                  <img
                    src={
                      user.profilePictures?.[0] ||
                      "https://via.placeholder.com/150"
                    }
                    alt={user.name}
                    className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover border-4 border-purple-500 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-sm">Ảnh đại diện</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                    {user.name}
                  </h2>
                  <p className="text-lg text-gray-600">{user.email}</p>
                  <p className="text-lg text-gray-700 italic">
                    "{user.bio || "Chưa có thông tin tiểu sử."}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 rounded-2xl p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold mb-4 text-purple-800 flex items-center gap-2">
                    <i className="fas fa-user"></i>
                    Thông tin cá nhân
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-purple-600">Tuổi</p>
                      <p className="text-lg font-medium text-purple-800">
                        {user.age || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-600">Cung hoàng đạo</p>
                      <p className="text-lg font-medium text-purple-800">
                        {user.zodiacSign || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-600">Học vấn</p>
                      <p className="text-lg font-medium text-purple-800">
                        {user.education || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-purple-600">Giới tính</p>
                      <p className="text-lg font-medium text-purple-800">
                        {user.gender === "male"
                          ? "Nam"
                          : user.gender === "female"
                          ? "Nữ"
                          : "Khác"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 rounded-2xl p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold mb-4 text-pink-800 flex items-center gap-2">
                    <i className="fas fa-heart"></i>
                    Sở thích
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests && user.interests.length > 0 ? (
                      user.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-base md:text-lg text-pink-700">
                        Chưa có thông tin về sở thích.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 rounded-2xl p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold mb-4 text-red-800 flex items-center gap-2">
                    <i className="fas fa-camera"></i>
                    Hình ảnh
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {user.profilePictures && user.profilePictures.length > 0 ? (
                      user.profilePictures.map((pic, index) => (
                        <img
                          key={index}
                          src={pic}
                          alt={`Ảnh ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))
                    ) : (
                      <p className="text-lg text-red-700 col-span-3">
                        Chưa có hình ảnh.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold mb-4 text-green-800 flex items-center gap-2">
                    <i className="fas fa-heart"></i>
                    Sở thích & Xu hướng
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-green-600">Thường làm gì lúc rảnh</p>
                      <p className="text-lg font-medium text-green-800 capitalize">
                        {user.hobbies || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600">Xu hướng tìm kiếm</p>
                      <p className="text-lg font-medium text-green-800">
                        {user.genderPreference === "male"
                          ? "Nam"
                          : user.genderPreference === "female"
                          ? "Nữ"
                          : "Cả hai"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <h3 className="text-2xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                    <i className="fas fa-map-marker-alt"></i>
                    Vị trí
                  </h3>
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <p className="text-blue-600">Thành phố</p>
                      <p className="text-lg font-medium text-blue-800">
                        {user.city || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Quận/Huyện</p>
                      <p className="text-lg font-medium text-blue-800">
                        {user.district || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setIsEditing(true)}
                  className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-edit"></i>
                    Chỉnh sửa hồ sơ
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
