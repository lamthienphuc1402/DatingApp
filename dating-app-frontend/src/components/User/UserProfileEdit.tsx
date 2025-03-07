import React, { useState, useEffect } from "react";
import axios from "axios";
import { deleteCloudinaryImg, useEditProfile } from "./hooks/useEditProfile.ts";
import LocationSelector from "../LocationSelector";
import { toast } from "react-toastify";

interface UserData {
  name: string;
  email: string;
  bio: string;
  interests: string;
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

// Thêm interface cho Tag
interface Tag {
  id: string;
  text: string;
}

// Thêm hàm kiểm tra trùng lặp (case insensitive)
const isDuplicateTag = (newTag: string, existingTags: Tag[]) => {
  return existingTags.some(
    (tag) => tag.text.toLowerCase() === newTag.toLowerCase()
  );
};

const UserProfileEdit = ({
  userId,
  onUpdate,
}: {
  userId: string;
  onUpdate: () => void;
}) => {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    bio: "",
    interests: "",
    profilePictures: [],
    age: 0,
    zodiacSign: "",
    education: "",
    hobbies: "",
    gender: "other",
    genderPreference: "both",
  });
  const [error, setError] = useState("");
  const [newProfilePictures, setNewProfilePictures] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState("");

  const edit = useEditProfile(userId);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Chuyển đổi interests thành tags
        let interestsArray = response.data.interests || [];
        // Nếu interests[0] là string JSON, parse nó
        if (
          interestsArray.length === 1 &&
          typeof interestsArray[0] === "string" &&
          interestsArray[0].startsWith("[")
        ) {
          try {
            interestsArray = JSON.parse(interestsArray[0]);
          } catch (e) {
            console.error("Error parsing interests:", e);
          }
        }

        // Loại bỏ các giá trị trùng lặp trước khi tạo tags
        const uniqueInterests = [
          ...new Set(interestsArray.map((i) => i.toLowerCase())),
        ];
        const tagsFromInterests = uniqueInterests.map((interest) => ({
          id: Math.random().toString(36).substr(2, 9),
          text: interest,
        }));

        setTags(tagsFromInterests as Tag[]);
        setUserData({
          name: response.data.name,
          email: response.data.email,
          bio: response.data.bio || "",
          interests: response.data.interests.join(", "),
          profilePictures: response.data.profilePictures || [],
          age: response.data.age,
          zodiacSign: response.data.zodiacSign,
          education: response.data.education,
          hobbies: response.data.hobbies,
          gender: response.data.gender,
          genderPreference: response.data.genderPreference,
        });
        setPreviewUrls(response.data.profilePictures);
      } catch (err) {
        setError("Không thể lấy thông tin người dùng.");
      }
    };

    fetchUserData();
  }, [userId]);

  const handleChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Tạo bản sao của mảng ảnh hiện tại
    const newProfilePicturesCopy = [...newProfilePictures];
    const previewUrlsCopy = [...previewUrls];

    // Cập nhật ảnh tại vị trí index
    newProfilePicturesCopy[index] = files[0];
    previewUrlsCopy[index] = URL.createObjectURL(files[0]);

    // Giữ nguyên thứ tự các ảnh khác
    setNewProfilePictures(newProfilePicturesCopy);
    setPreviewUrls(previewUrlsCopy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    // Lấy các giá trị unique từ tags
    const uniqueInterests = [...new Set(tags.map((tag) => tag.text))];

    // Gửi từng phần tử riêng biệt
    uniqueInterests.forEach((interest) => {
      formData.append("interests[]", interest);
    });

    console.log("check images array");
    console.log(newProfilePictures);
    // Thêm các ảnh vào formData theo thứ tự
    newProfilePictures.forEach((file, index) => {
      // Đặt tên file để giữ thứ tự
      if (file) {
        formData.append(`profilePictures`, file);
        formData.append(`indexes`, index.toString());
      }
    });
    // Thêm các thông tin khác
    formData.append("name", userData.name);
    formData.append("email", userData.email);
    formData.append("bio", userData.bio);
    formData.append("age", userData.age.toString());
    formData.append("zodiacSign", userData.zodiacSign);
    formData.append("education", userData.education);
    formData.append("hobbies", userData.hobbies);
    formData.append("gender", userData.gender);
    formData.append("genderPreference", userData.genderPreference);

    await edit.mutateAsync(formData);
    toast.success("Cập nhật thông tin thành công!");
  };

  const removePreviewImage = async (index: number) => {
    const url = previewUrls[index];
    if (url.includes("cloudinary")) {
      const isDeleted: boolean = await deleteCloudinaryImg(userId, url);
      isDeleted
        ? toast.success("Xóa hình ảnh thành công!")
        : toast.error("Không thể xóa hình ảnh!");
    }
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setNewProfilePictures(newProfilePictures.filter((_, i) => i !== index));
  };

  // Thêm các handlers cho tags
  const handleDeleteTag = (tagToDelete: Tag) => {
    setTags(tags.filter((tag) => tag.id !== tagToDelete.id));
  };

  // Sửa lại handler thêm tag
  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !isDuplicateTag(trimmedValue, tags)) {
      setTags([
        ...tags,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: trimmedValue,
        },
      ]);
      setInputValue("");
    }
  };

  // Handler cho input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Nếu người dùng nhập dấu phẩy
    if (value.includes(",")) {
      const newTag = value.replace(",", "");
      handleAddTag(newTag);
    } else {
      setInputValue(value);
    }
  };

  const handleLocationUpdate = (location: {
    type: string;
    coordinates: number[];
  }) => {
    setUserData((prevData) => ({ ...prevData, location }));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white bg-opacity-95 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Cập nhật thông tin
            </h2>
            <button
              onClick={() => onUpdate()}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 rounded-lg text-red-700 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-purple-600 border-b border-purple-200 pb-2">
                <i className="fas fa-images mr-2"></i>Ảnh của bạn
              </h3>

              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {/* Avatar slot - always first image */}
                <div className="relative group col-span-1">
                  <img
                    src={
                      previewUrls[0] ||
                      userData.profilePictures[0] ||
                      "https://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    className="w-full h-40 object-cover rounded-lg border-4 border-purple-500 transition-all duration-300 group-hover:border-pink-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <label
                      htmlFor="profile-picture"
                      className="cursor-pointer text-white text-sm flex flex-col items-center space-y-2"
                    >
                      <i className="fas fa-user-circle text-2xl"></i>
                      <span>Ảnh đại diện</span>
                    </label>
                  </div>
                </div>

                {/* Additional photos */}
                {[...Array(5)].map((_, index) => (
                  <div key={index + 1} className="relative group col-span-1">
                    <img
                      src={
                        previewUrls[index + 1] ||
                        "https://via.placeholder.com/150"
                      }
                      alt={`Photo ${index + 2}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-300 transition-all duration-300 group-hover:border-purple-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <label
                        htmlFor={`additional-photo-${index}`}
                        className="cursor-pointer text-white text-sm flex flex-col items-center space-y-2"
                      >
                        <i className="fas fa-plus text-2xl"></i>
                        <span>Thêm ảnh</span>
                      </label>
                    </div>
                    {(previewUrls[index + 1] ||
                      userData.profilePictures[index + 1]) && (
                      <button
                        type="button"
                        onClick={() => removePreviewImage(index + 1)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Hidden file inputs */}
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 0)}
                className="hidden"
              />
              {[...Array(5)].map((_, index) => (
                <input
                  key={index}
                  id={`additional-photo-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, index + 1)}
                  className="hidden"
                />
              ))}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* Thông tin cơ bản */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-purple-600 border-b border-purple-200 pb-2">
                  <i className="fas fa-user-circle mr-2"></i>Thông tin cơ bản
                </h3>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-signature mr-2 text-purple-500"></i>Tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    placeholder="Tên của bạn"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-envelope mr-2 text-purple-500"></i>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-birthday-cake mr-2 text-purple-500"></i>
                    Tuổi
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={userData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-star mr-2 text-purple-500"></i>Cung
                    hoàng đạo
                  </label>
                  <select
                    name="zodiacSign"
                    value={userData.zodiacSign}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                  >
                    <option value="">Chọn cung hoàng đạo</option>
                    <option value="Bạch Dương">Bạch Dương</option>
                    <option value="Kim Ngưu">Kim Ngưu</option>
                    <option value="Song Tử">Song Tử</option>
                    <option value="Cự Giải">Cự Giải</option>
                    <option value="Sư Tử">Sư Tử</option>
                    <option value="Xử Nữ">Xử Nữ</option>
                    <option value="Thiên Bình">Thiên Bình</option>
                    <option value="Bọ Cạp">Bọ Cạp</option>
                    <option value="Nhân Mã">Nhân Mã</option>
                    <option value="Ma Kết">Ma Kết</option>
                    <option value="Bảo Bình">Bảo Bình</option>
                    <option value="Song Ngư">Song Ngư</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-map-marker-alt mr-2 text-purple-500"></i>
                    Vị trí
                  </label>
                  <LocationSelector
                    onLocationUpdate={handleLocationUpdate}
                    initialCity={userData?.city}
                    initialDistrict={userData?.district}
                  />
                </div>
              </div>

              {/* Thông tin bổ sung */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-purple-600 border-b border-purple-200 pb-2">
                  <i className="fas fa-heart mr-2"></i>Thông tin bổ sung
                </h3>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-book-open mr-2 text-purple-500"></i>
                    Tiểu sử
                  </label>
                  <textarea
                    name="bio"
                    value={userData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    placeholder="Hãy chia sẻ đôi điều về bản thân..."
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-graduation-cap mr-2 text-purple-500"></i>
                    Học vấn
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={userData.education}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    placeholder="Bạn đang học tập/làm việc ở đâu?"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-clock mr-2 text-purple-500"></i>Thường
                    làm gì lúc rảnh
                  </label>
                  <input
                    type="text"
                    name="hobbies"
                    value={userData.hobbies}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    placeholder="Ví dụ: Nghe nhạc, nấu ăn, đọc sách..."
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <i className="fas fa-heart mr-2 text-purple-500"></i>Sở
                    thích
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border border-purple-200 rounded-xl bg-white">
                    {/* Tags container */}
                    <div className="flex flex-wrap gap-2 w-full mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
                        >
                          {tag.text}
                          <button
                            type="button"
                            onClick={() => handleDeleteTag(tag)}
                            className="ml-2 focus:outline-none"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Input container - luôn nằm trên một dòng mới */}
                    <div className="flex items-center w-full min-h-[32px] bg-purple-50 rounded-xl p-1">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="flex-1 outline-none bg-white rounded-xl"
                        placeholder={
                          tags.length === 0 ? "Nhập sở thích..." : ""
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(inputValue)}
                        className="ml-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                        disabled={!inputValue.trim()}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Nhập và nhấn nút thêm hoặc dùng dấu phẩy để thêm sở thích
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-venus-mars mr-2 text-purple-500"></i>
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={userData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <i className="fas fa-search-heart mr-2 text-purple-500"></i>
                      Quan tâm đến
                    </label>
                    <select
                      name="genderPreference"
                      value={userData.genderPreference}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-400"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="both">Cả hai</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-purple-200">
              <button
                type="button"
                onClick={() => onUpdate()}
                className="px-8 py-3 rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-all duration-300 flex items-center space-x-2"
              >
                <i className="fas fa-times"></i>
                <span>Hủy</span>
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
              >
                <i className="fas fa-heart"></i>
                <span>Lưu</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileEdit;
