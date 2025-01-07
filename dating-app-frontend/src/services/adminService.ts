import axios from "axios";

const API_URL = "${import.meta.env.VITE_LOCAL_API_URL}/admin";

export const adminService = {
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });
    if (response.data) {
      localStorage.setItem("adminToken", response.data.token);
    }
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  },
};
