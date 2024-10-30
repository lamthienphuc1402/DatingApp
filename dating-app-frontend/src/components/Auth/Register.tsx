import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useSubmitRegister} from "./hooks/useRegister";

type RegisterType = {
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    setUserId: React.Dispatch<React.SetStateAction<string>>;
};

// @ts-ignore
const Register = ({setIsLoggedIn, setUserId}: RegisterType) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [interests, setInterests] = useState("");
    const [avatars, setAvatars] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [error, setError] = useState("");

    const submit = useSubmitRegister(
        setError
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setAvatars(filesArray);

            const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file));
            setPreviewUrls(newPreviewUrls);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("interests", interests.split(",").toString());
        avatars.forEach((avatar) => {
            formData.append("profilePictures", avatar);
        });

        await submit.mutateAsync(formData);
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    Đăng Ký
                </h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form method="POST" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Tên
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="interests"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Sở thích
                        </label>
                        <input
                            id="interests"
                            type="text"
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="avatars"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Ảnh cá nhân
                        </label>
                        <input
                            id="avatars"
                            type="file"
                            onChange={handleFileChange}
                            multiple
                            accept="image/*"
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                    </div>
                    {previewUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
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

