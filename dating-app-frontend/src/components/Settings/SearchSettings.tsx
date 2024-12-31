import React, { useState, useEffect } from "react";
import axios from "axios";

interface SearchPreferences {
  prioritizeInterests: boolean;
  prioritizeAge: boolean;
  prioritizeEducation: boolean;
  prioritizeZodiac: boolean;
  prioritizeOnline: boolean;
  searchDistance: number;
}

const defaultPreferences: SearchPreferences = {
  prioritizeInterests: true,
  prioritizeAge: true,
  prioritizeEducation: true,
  prioritizeZodiac: true,
  prioritizeOnline: true,
  searchDistance: 100,
};

const SearchSettings = () => {
  const [preferences, setPreferences] = useState<SearchPreferences>(() => {
    const savedPrefs = localStorage.getItem("searchPreferences");
    return savedPrefs ? JSON.parse(savedPrefs) : defaultPreferences;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");

      // Lưu vào localStorage
      await localStorage.setItem(
        "searchPreferences",
        JSON.stringify(preferences)
      );

      // Gửi lên backend
      await axios.put(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/${
          userData._id
        }/search-preferences`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setIsDirty(false);
      alert("Đã lưu thay đổi thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-4 sm:p-8 rounded-3xl shadow-xl">
      <div className="border-b pb-6 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Tùy chọn tìm kiếm
            </h2>
            <p className="text-gray-600 mt-2">
              Tùy chỉnh các ưu tiên để tìm kiếm người phù hợp với bạn
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all
              ${
                isDirty
                  ? "bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
              ${isSaving ? "opacity-75 cursor-wait" : ""}
            `}
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="prioritizeInterests"
              checked={preferences.prioritizeInterests}
              onChange={handleChange}
              className="form-checkbox h-6 w-6 text-pink-500 rounded-lg focus:ring-pink-500"
            />
            <div className="ml-4">
              <label className="font-medium text-gray-800">
                Ưu tiên sở thích chung
              </label>
              <p className="text-sm text-gray-600">
                Tìm người có cùng sở thích với bạn
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="prioritizeAge"
              checked={preferences.prioritizeAge}
              onChange={handleChange}
              className="form-checkbox h-6 w-6 text-pink-500 rounded-lg focus:ring-pink-500"
            />
            <div className="ml-4">
              <label className="font-medium text-gray-800">
                Ưu tiên độ tuổi gần nhau
              </label>
              <p className="text-sm text-gray-600">
                Tìm người có đ�� tuổi gần nhau với bạn
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="prioritizeEducation"
              checked={preferences.prioritizeEducation}
              onChange={handleChange}
              className="form-checkbox h-6 w-6 text-pink-500 rounded-lg focus:ring-pink-500"
            />
            <div className="ml-4">
              <label className="font-medium text-gray-800">
                Ưu tiên trình độ học vấn
              </label>
              <p className="text-sm text-gray-600">
                Tìm người có trình độ học vấn tương đồng với bạn
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="prioritizeZodiac"
              checked={preferences.prioritizeZodiac}
              onChange={handleChange}
              className="form-checkbox h-6 w-6 text-pink-500 rounded-lg focus:ring-pink-500"
            />
            <div className="ml-4">
              <label className="font-medium text-gray-800">
                Ưu tiên cung hoàng đạo hợp nhau
              </label>
              <p className="text-sm text-gray-600">
                Tìm người có cung hoàng đạo hợp nhau với bạn
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              name="prioritizeOnline"
              checked={preferences.prioritizeOnline}
              onChange={handleChange}
              className="form-checkbox h-6 w-6 text-pink-500 rounded-lg focus:ring-pink-500"
            />
            <div className="ml-4">
              <label className="font-medium text-gray-800">
                Ưu tiên người dùng đang online
              </label>
              <p className="text-sm text-gray-600">
                Tìm người đang online để trò chuyện
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-medium text-gray-800">
                Khoảng cách tìm kiếm
              </h3>
              <p className="text-sm text-gray-600">
                Bán kính tìm kiếm: {preferences.searchDistance} km
              </p>
            </div>
            <span className="text-xl sm:text-2xl font-semibold text-pink-500">
              {preferences.searchDistance} km
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="1000"
            value={preferences.searchDistance}
            onChange={(e) => {
              setPreferences((prev) => ({
                ...prev,
                searchDistance: parseInt(e.target.value),
              }));
              setIsDirty(true);
            }}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>1 km</span>
            <span>1000 km</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`w-full px-6 py-3 rounded-xl font-medium transition-all
            ${
              isDirty
                ? "bg-pink-500 text-white hover:bg-pink-600 active:bg-pink-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
            ${isSaving ? "opacity-75 cursor-wait" : ""}
          `}
        >
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
};

export default SearchSettings;
