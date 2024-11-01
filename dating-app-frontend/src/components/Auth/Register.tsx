import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useSubmitRegister} from "./hooks/useRegister";

type RegisterType = {
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    setUserId: React.Dispatch<React.SetStateAction<string>>;
};
// @ts-ignore
const Register = ({setIsLoggedIn, setUserId}: RegisterType) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        password: '',
        bio: '',
        interests: '',
        age: '',
        zodiacSign: '',
        education: '',
        hobbies: '',
        gender: 'other',
        genderPreference: 'both'
    });
    const [error, setError] = useState('');
    const [profilePictures, setProfilePictures] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const submit = useSubmitRegister(setError, navigate);

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const {name, value} = e.target;
        setUserData(prev => ({...prev, [name]: value}));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setProfilePictures(files);
        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        // Thêm các ảnh vào formData
        profilePictures.forEach((file, index) => {
            formData.append('profilePictures', file);
        });

        // Thêm các thông tin khác
        Object.keys(userData).forEach(key => {
            if (key === 'interests') {
                formData.append(key, userData[key].split(',').toString());
            } else {
                formData.append(key, userData[key]);
            }
        });

        await submit.mutateAsync(formData);
    };

    // Thêm constant cho zodiac signs
    const ZODIAC_SIGNS = [
        'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
        'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
        'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Đăng Ký</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thông tin cơ bản */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800">Thông tin cơ bản</h3>
                            
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={userData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={userData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={userData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={userData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cung hoàng đạo</label>
                                <select
                                    name="zodiacSign"
                                    value={userData.zodiacSign}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="">Chọn cung hoàng đạo</option>
                                    {ZODIAC_SIGNS.map((sign) => (
                                        <option key={sign} value={sign}>
                                            {sign}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Thông tin bổ sung */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800">Thông tin bổ sung</h3>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
                                <textarea
                                    name="bio"
                                    value={userData.bio}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                />
                            </div>


                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Học vấn</label>
                                <input
                                    type="text"
                                    name="education"
                                    value={userData.education}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sở thích</label>
                                <input
                                    type="text"
                                    name="interests"
                                    value={userData.interests}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bạn thường làm gì khi rảnh?</label>
                                <input
                                    type="text"
                                    name="hobbies"
                                    value={userData.hobbies}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                                    <select
                                        name="gender"
                                        value={userData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quan tâm đến</label>
                                    <select
                                        name="genderPreference"
                                        value={userData.genderPreference}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                        <option value="both">Cả hai</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần upload ảnh */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-purple-600">Ảnh cá nhân</h3>
                        <input
                            type="file"
                            onChange={handleImageUpload}
                            multiple
                            accept="image/*"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {previewUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-md"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                    >
                        Đăng Ký
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;

