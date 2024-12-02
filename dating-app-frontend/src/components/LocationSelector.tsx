import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LocationSelectorProps {
  onLocationUpdate: () => void;
  initialCity?: string;
  initialDistrict?: string;
}

const LocationSelector = ({ onLocationUpdate, initialCity, initialDistrict }: LocationSelectorProps) => {
  const [city, setCity] = useState(initialCity || '');
  const [district, setDistrict] = useState(initialDistrict || '');
  const [message, setMessage] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);

  const cities = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Biên Hòa',
    'Nha Trang',
    'Huế',
  ];

  const districtsByCity: { [key: string]: string[] } = {
    'Hồ Chí Minh': [
      'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5',
      'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
      'Quận 11', 'Quận 12', 'Thủ Đức', 'Bình Thạnh', 'Gò Vấp',
      'Phú Nhuận', 'Tân Bình', 'Tân Phú'
    ],
    'Hà Nội': [
      'Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa',
      'Tây Hồ', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai',
      'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông'
    ],
    'Đà Nẵng': [
      'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn',
      'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'
    ],
  };

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
        if (userId) {
          const response = await axios.get(
            `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
          
          if (response.data.city) {
            setCity(response.data.city);
            setDistricts(districtsByCity[response.data.city] || []);
            if (response.data.district) {
              setDistrict(response.data.district);
            }
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin vị trí:', error);
      }
    };

    if (!initialCity && !initialDistrict) {
      fetchUserLocation();
    } else {
      if (initialCity) {
        setDistricts(districtsByCity[initialCity] || []);
      }
    }
  }, [initialCity, initialDistrict]);

  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
    setDistricts(districtsByCity[selectedCity] || []);
    setDistrict('');
  };

  const handleSubmit = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      await axios.put(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}/location`,
        { city, district },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setMessage('Cập nhật vị trí thành công!');
      onLocationUpdate();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Lỗi khi cập nhật vị trí');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Thành phố
        </label>
        <select 
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        >
          <option value="">Chọn thành phố</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quận/Huyện
        </label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          disabled={!city}
        >
          <option value="">Chọn quận/huyện</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!city || !district}
        className={`w-full p-2 rounded text-white transition-colors duration-200 
          ${!city || !district 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-pink-500 hover:bg-pink-600'}`}
      >
        Cập nhật vị trí
      </button>
    </div>
  );
};

export default LocationSelector; 