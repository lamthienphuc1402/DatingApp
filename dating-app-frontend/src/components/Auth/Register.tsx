import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubmitRegister } from "./hooks/useRegister";

type RegisterType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
};

const Register = ({ setIsLoggedIn, setUserId }: RegisterType) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState("");
  const [profilePictures, setProfilePictures] = useState<string[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = useSubmitRegister(
    navigate,
    setError,
    setIsLoggedIn,
    setUserId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      email,
      password,
      interests: interests.split(","),
      profilePictures,
    };
    await submit.mutateAsync(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setProfilePictures(files.map((file) => URL.createObjectURL(file as Blob)));
  };

  const inputClass = "border rounded w-full py-2 px-3 bg-white text-black";

  return (
    <div className=" flex items-center justify-center h-screen bg-gradient-to-r from-pink-300 to-purple-300">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl mb-4">Đăng Ký</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Tên</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Sở thích</label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white rounded py-2 px-4"
        >
          Đăng Ký
        </button>
      </form>
    </div>
  );
};

export default Register;
