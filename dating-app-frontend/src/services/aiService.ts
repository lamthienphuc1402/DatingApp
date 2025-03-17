import axios from "axios";

const API_URL = `${import.meta.env.VITE_LOCAL_API_URL}/ai`;

export const aiService = {
  // Tính điểm tương thích giữa hai người dùng
  getCompatibility: async (userId1: string, userId2: string) => {
    const response = await axios.get(`${API_URL}/compatibility/${userId1}/${userId2}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  },

  // Lấy danh sách người dùng phù hợp nhất dựa trên AI
  getTopMatches: async (userId: string, limit: number = 10) => {
    const response = await axios.get(`${API_URL}/matches/${userId}?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  },

  // Lấy đề xuất người dùng với phân trang và các tiêu chí nâng cao
  getRecommendations: async (userId: string, limit: number = 9, useAI: boolean = true, page: number = 1) => {
    const response = await axios.get(
      `${API_URL}/recommendations/${userId}`, {
        params: {
          limit,
          page,
          useAI: useAI.toString(),
          includeDetails: true,
          includeCompatibility: true,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },

  // Thích một người dùng và cập nhật dữ liệu training
  likeUser: async (userId: string, targetUserId: string, interactionData?: any) => {
    const response = await axios.post(
      `${import.meta.env.VITE_LOCAL_API_URL}/users/like`,
      {
        userId,
        targetUserId,
        interactionData, // Dữ liệu tương tác để train model
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },

  // Cập nhật lịch sử match để train model
  updateMatchHistory: async (
    userId: string,
    targetUserId: string,
    wasSuccessfulMatch: boolean,
    interactionMetrics?: {
      chatDuration: number;
      messageCount: number;
      averageResponseTime: number;
      lastInteraction: Date;
      commonInterests: string[];
      distance: number;
      ageGap: number;
    }
  ) => {
    const response = await axios.post(
      `${API_URL}/match-history`,
      {
        userId,
        targetUserId,
        wasSuccessfulMatch,
        interactionMetrics,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },

  // Lấy insights về match
  getMatchingInsights: async (userId: string, matchId: string) => {
    const response = await axios.get(
      `${API_URL}/matching-insights/${userId}/${matchId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },

  // Lấy thông tin chi tiết về model (chỉ dành cho admin)
  getModelStats: async () => {
    const response = await axios.get(`${API_URL}/model-stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  },

  // Lấy phân phối điểm match (chỉ dành cho admin)
  getMatchDistribution: async () => {
    const response = await axios.get(`${API_URL}/match-distribution`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return response.data;
  },

  // Train lại model (chỉ dành cho admin)
  trainModel: async () => {
    const response = await axios.post(
      `${API_URL}/train`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      }
    );
    return response.data;
  },

  // Dự đoán tỷ lệ match giữa hai người dùng
  predictMatch: async (userId: string, targetUserId: string) => {
    const response = await axios.get(`${API_URL}/predict-match/${userId}/${targetUserId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  },

  // Tính điểm tương thích chi tiết giữa hai người dùng
  getDetailedCompatibility: async (userId1: string, userId2: string) => {
    const response = await axios.get(
      `${API_URL}/compatibility/detailed/${userId1}/${userId2}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },
}; 