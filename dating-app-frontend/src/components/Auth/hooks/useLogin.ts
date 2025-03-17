import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { NavigateFunction } from "react-router-dom";

const submitLogin = async (email: string, password: string) => {
  const response = await axios.post(
    `${import.meta.env.VITE_LOCAL_API_URL}/users/login`,
    {
      email,
      password,
    }
  );
  return response;
};

export const useSubmitLogin = (
  navigate: NavigateFunction,
  setError: React.Dispatch<React.SetStateAction<any>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  setUserId: React.Dispatch<React.SetStateAction<string>>,
  connect: (userId: string) => void
) => {
  const { mutateAsync, data, error, isLoading, isSuccess } = useMutation({
    mutationKey: ["submitLoginForm"],
    mutationFn: async ({ email, password }: any) => {
      const result = await submitLogin(email, password);
      return result.data;
    },
    onSuccess(data) {
      setIsLoggedIn(true);
      setUserId(data.user._id);
      localStorage.setItem("token", data.token.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      connect(data.user._id);
      
      navigate("/");
    },
    onError(error: any) {
      console.log(error);
      setError(error.message);
    },
  });
  return { mutateAsync, data, error, isLoading, isSuccess };
};
