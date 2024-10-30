import {useMutation} from "@tanstack/react-query";
import axios from "axios";

const submitEditProfile = async (data: any, userId: string) => {
    return await axios.put(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/${userId}`,
        data,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );
}

export const useEditProfile = (userId: string) => {
    const {mutateAsync, data, error, isLoading, isSuccess} = useMutation({
        mutationKey: ["submitEditProfile"],
        mutationFn: async (data: any) => {
            console.log("called");
            const result = await submitEditProfile(data, userId);
            return result.data;
        },
        onSuccess(data) {
            console.log(data);
            alert("Chỉnh sửa thannh công");
            window.location.reload();
        },
        onError(error: any) {
            console.error(error);
        }
    });
    return {mutateAsync, data, error, isLoading, isSuccess};
}