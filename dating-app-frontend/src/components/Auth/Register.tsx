import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useSubmitRegister} from "./hooks/useRegister";
// Thêm interfaces
interface Tag {
    id: string;
    text: string;
}
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
    const [tags, setTags] = useState<Tag[]>([]);
    const [inputValue, setInputValue] = useState('');

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

    const handleDeleteTag = (tagToDelete: Tag) => {
        setTags(tags.filter(tag => tag.id !== tagToDelete.id));
    };

    const handleAddTag = (value: string) => {
        const trimmedValue = value.trim();
        if (trimmedValue && !isDuplicateTag(trimmedValue, tags)) {
            setTags([...tags, { 
                id: Math.random().toString(36).substr(2, 9), 
                text: trimmedValue 
            }]);
            setInputValue('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.includes(',')) {
            const newTag = value.replace(',', '');
            handleAddTag(newTag);
        } else {
            setInputValue(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();

        // Thêm các ảnh vào formData
        profilePictures.forEach((file, index) => {
            formData.append('profilePictures', file);
        });

        // Xử lý interests giống như trong UserProfileEdit
        const uniqueInterests = [...new Set(tags.map(tag => tag.text))];
        uniqueInterests.forEach(interest => {
            formData.append("interests[]", interest);
        });

        // Thêm các thông tin khác
        Object.keys(userData).forEach(key => {
            if (key !== 'interests') {
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

    // Thêm hàm kiểm tra trùng lặp
    const isDuplicateTag = (newTag: string, existingTags: Tag[]) => {
        return existingTags.some(tag => 
            tag.text.toLowerCase() === newTag.toLowerCase()
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4 py-12 mt-6">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fas fa-heart mr-2 text-purple-500"></i>Sở thích
                                </label>
                                <div className="flex flex-wrap gap-2 p-2 border border-purple-200 rounded-xl bg-white">
                                    {/* Tags container */}
                                    <div className="flex flex-wrap gap-2 w-full mb-2">
                                        {tags.map(tag => (
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
                                    
                                    {/* Input container */}
                                    <div className="flex items-center w-full min-h-[32px] bg-purple-50 rounded-xl p-1">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            className="flex-1 outline-none bg-white rounded-xl px-3 py-1"
                                            placeholder={tags.length === 0 ? "Nhập sở thích..." : ""}
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

