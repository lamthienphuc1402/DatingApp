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
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-pink-300 to-purple-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl mb-4">Đăng Nhập</h2>
        {error !== "" && <p className="text-red-500">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            className="border rounded w-full py-2 px-3"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="border rounded w-full py-2 px-3"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white rounded py-2 px-4"
        >
          Đăng Nhập
        </button>
      </form>
    </div>
  );
};

export default Login;
