import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const submitEditProfile = async (data: any, userId: string) => {
  return await axios.put(
    `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
};

export const deleteCloudinaryImg = async (userId: string, url: string) => {
  const result = await axios.put(
    `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}/delete-image`,
    {
      url,
    },
    {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  console.log(result.data);
  if (result.status === 200) {
    return true;
  }
  return false;
};

export const useEditProfile = (userId: string) => {
  return useMutation({
    mutationFn: (data: any) => submitEditProfile(data, userId),
  });
};
