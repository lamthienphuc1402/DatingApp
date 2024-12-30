import { NavigateFunction } from "react-router-dom";
import {useMutation} from "@tanstack/react-query";
import axios from "axios";

const submitRegister = async (data: any) => {
    return await axios.post(
        `${import.meta.env.VITE_LOCAL_API_URL}/users/register`,
        data,
        {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const useSubmitRegister = (
    setError: React.Dispatch<React.SetStateAction<any>>,
    navigate: NavigateFunction
) => {
    const {mutateAsync, data, error, isLoading, isSuccess} = useMutation({
        mutationKey: ["submitRegisterForm"],
        mutationFn: async (data: any) => {
            console.log("called");
            const result = await submitRegister(data);
            return result.data;
        },
        onSuccess(data) {
            navigate("/login");
        },
        onError(error: any) {
            console.log(error);
            setError(error.message);
        },
    });
    return {mutateAsync, data, error, isLoading, isSuccess};
};
