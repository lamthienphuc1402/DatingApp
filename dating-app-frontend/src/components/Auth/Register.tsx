import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubmitRegister } from "./hooks/useRegister";
import { toast } from 'react-toastify';
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
const Register = ({ setIsLoggedIn, setUserId }: RegisterType) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    const submit = useSubmitRegister(setError, navigate);

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Tạo bản sao của mảng ảnh hiện tại
        const newProfilePicturesCopy = [...profilePictures];
        const previewUrlsCopy = [...previewUrls];

        // Cập nhật ảnh tại vị trí index
        newProfilePicturesCopy[index] = files[0];
        previewUrlsCopy[index] = URL.createObjectURL(files[0]);

        setProfilePictures(newProfilePicturesCopy);
        setPreviewUrls(previewUrlsCopy);
    };

    const removePreviewImage = (index: number) => {
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
        setProfilePictures(profilePictures.filter((_, i) => i !== index));
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

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        
        // Validate thông tin cơ bản
        if (!userData.name.trim()) errors.name = 'Vui lòng nhập tên';
        if (!userData.email.trim()) errors.email = 'Vui lòng nhập email';
        if (!userData.password.trim()) errors.password = 'Vui lòng nhập mật khẩu';
        if (!userData.age) errors.age = 'Vui lòng nhập tuổi';
        if (!userData.zodiacSign) errors.zodiacSign = 'Vui lòng chọn cung hoàng đạo';
        
        // Validate ít nhất 1 ảnh
        if (profilePictures.length === 0) {
            errors.photos = 'Vui lòng tải lên ít nhất 1 ảnh';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form trước khi submit
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setIsSubmitting(true);
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

        try {
            await submit.mutateAsync(formData);
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        } catch (err) {
            toast.error('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!');
        } finally {
            setIsSubmitting(false);
        }
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
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    {/* <i className="fas fa-user-plus mr-2 text-purple-500"></i> */}
                    Đăng Ký
                </h2>
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                <i className="fas fa-info-circle mr-2 text-purple-500"></i>
                                Thông tin cơ bản
                            </h3>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <i className="fas fa-user mr-2 text-purple-500"></i>
                                    Tên
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={userData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 rounded-lg border ${
                                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                                    } bg-white text-black focus:ring-2 focus:ring-purple-500 transition-all duration-200`}
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        <i className="fas fa-exclamation-circle mr-1"></i>
                                        {formErrors.name}
                                    </p>
                                )}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Xu hướng tính dục</label>
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

                        </div>


                        {/* Thông tin bổ sung */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                <i className="fas fa-star mr-2 text-purple-500"></i>
                                Thông tin bổ sung
                            </h3>

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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cung hoàng đạo</label>
                                <select
                                    name="zodiacSign"
                                    value={userData.zodiacSign}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                    
                                >
                                    <option value="">Chọn cung hoàng đạo</option>
                                    {ZODIAC_SIGNS.map((sign) => (
                                        <option key={sign} value={sign}>
                                            {sign}
                                        </option>
                                    ))}
                                </select>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bạn thường làm gì khi rảnh?</label>
                                <input
                                    type="text"
                                    name="hobbies"
                                    value={userData.hobbies}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border bg-white text-black focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            {/* Phần upload ảnh */}
                            <div className="form-group">
                                <h3 className="text-xl font-semibold text-purple-600 mb-2">Ảnh cá nhân</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Avatar slot - luôn là ảnh đầu tiên */}
                                    <div className="relative group">
                                        <img
                                            src={previewUrls[0] || 'https://via.placeholder.com/150'}
                                            alt="Avatar"
                                            className="w-full h-32 object-cover rounded-lg border-2 border-purple-500"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <label htmlFor="profile-picture" className="cursor-pointer text-white text-sm text-center">
                                                <i className="fas fa-user-circle text-xl mb-1"></i>
                                                <br/>Ảnh đại diện
                                            </label>
                                        </div>
                                        {previewUrls[0] && (
                                            <button
                                                type="button"
                                                onClick={() => removePreviewImage(0)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                                            >
                                                <i className="fas fa-times text-xs"></i>
                                            </button>
                                        )}
                                    </div>

                                    {/* Các ảnh bổ sung */}
                                    {[1, 2].map((index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={previewUrls[index] || 'https://via.placeholder.com/150'}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100">
                                                <label htmlFor={`additional-photo-${index}`} className="cursor-pointer text-white text-sm text-center">
                                                    <i className="fas fa-plus text-xl mb-1"></i>
                                                    <br/>Thêm ảnh
                                                </label>
                                            </div>
                                            {previewUrls[index] && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePreviewImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                                                >
                                                    <i className="fas fa-times text-xs"></i>
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
                                {[1, 2].map((index) => (
                                    <input
                                        key={index}
                                        id={`additional-photo-${index}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, index)}
                                        className="hidden"
                                    />
                                ))}
                                <p className="text-sm text-gray-500 mt-1">
                                    Tải lên tối đa 3 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện.
                                </p>
                            </div>
                        </div>

                    </div>



                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${
                            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-heart mr-2"></i>
                                Đăng Ký
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;

