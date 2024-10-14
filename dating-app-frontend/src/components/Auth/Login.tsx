import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubmitLogin } from "./hooks/useLogin";

export type LoginType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
};

const Login = ({ setIsLoggedIn, setUserId }: LoginType) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>("");
  const navigate = useNavigate();
  const submit = useSubmitLogin(navigate, setError, setIsLoggedIn, setUserId);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit.mutateAsync({
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Đăng Nhập</h2>
        {error !== "" && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 bg-white text-black border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            Đăng Nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
