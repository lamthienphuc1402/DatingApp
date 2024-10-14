import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { NavigateFunction } from "react-router-dom";
import { io } from "socket.io-client";

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
  setSocket: any
) => {
  const { mutateAsync, data, error, isLoading, isSuccess } = useMutation({
    mutationKey: ["submitLoginForm"],
    mutationFn: async ({ email, password }: any) => {
      console.log("called");
      const result = await submitLogin(email, password);
      return result.data;
    },
    onSuccess(data) {
      setIsLoggedIn(true);
      setUserId(data.user._id);
      localStorage.setItem("token", data.token.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      const socket = io(
        `${import.meta.env.VITE_LOCAL_API_URL}?userId=${data.user._id}`
      );
      socket.emit("userStatus");
      socket.on("userStatus", (response: any) => {
        console.log(response);
      });
      setSocket(socket);
      navigate("/");
    },
    onError(error: any) {
      console.log(error);
      setError(error.message);
    },
  });
  return { mutateAsync, data, error, isLoading, isSuccess };
};
