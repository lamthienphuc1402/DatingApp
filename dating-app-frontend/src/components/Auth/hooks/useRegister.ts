import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { NavigateFunction } from "react-router-dom";

const submitRegister = async (data: any) => {
  console.log(DataTransferItem);
  const response = await axios.post(
    `${import.meta.env.VITE_LOCAL_API_URL}/users/register`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response;
};

export const useSubmitRegister = (
  navigate: NavigateFunction,
  setError: React.Dispatch<React.SetStateAction<any>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  setUserId: React.Dispatch<React.SetStateAction<string>>
) => {
  const { mutateAsync, data, error, isLoading, isSuccess } = useMutation({
    mutationKey: ["submitRegisterForm"],
    mutationFn: async (data: any) => {
      console.log("called");
      const result = await submitRegister(data);
      return result.data;
    },
    onSuccess(data) {
      console.log(data);
      // setIsLoggedIn(true);
      // setUserId(data.user._id);
      // localStorage.setItem("token", data.token.refreshToken);
      // localStorage.setItem("user", JSON.stringify(data.user));
      // navigate("/");
    },
    onError(error: any) {
      console.log(error);
      setError(error.message);
    },
  });
  return { mutateAsync, data, error, isLoading, isSuccess };
};
