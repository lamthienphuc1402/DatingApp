import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import AIInsights from "../AI/AIInsights";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  onlineUsers: number;
  todayNewUsers: number;
  userGrowth?: { date: string; count: number }[];
  genderDistribution?: { male: number; female: number; other: number };
  ageGroups?: { [key: string]: number };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "analytics">("overview");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/admin/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setStats(response.data);
    } catch (error) {
      toast.error("Không thể tải thống kê");
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu cho biểu đồ tăng trưởng người dùng
  const userGrowthData = {
    labels: stats?.userGrowth?.map((item) => item.date) || [],
    datasets: [
      {
        label: "Số người dùng mới",
        data: stats?.userGrowth?.map((item) => item.count) || [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  // Dữ liệu cho biểu đồ phân bố giới tính
  const genderData = {
    labels: ["Nam", "Nữ", "Khác"],
    datasets: [
      {
        data: stats?.genderDistribution
          ? [
              stats.genderDistribution.male,
              stats.genderDistribution.female,
              stats.genderDistribution.other,
            ]
          : [],
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 99, 132, 0.8)",
          "rgba(75, 192, 192, 0.8)",
        ],
      },
    ],
  };

  // Dữ liệu cho biểu đồ nhóm tuổi
  const ageGroupData = {
    labels: Object.keys(stats?.ageGroups || {}),
    datasets: [
      {
        label: "Số người dùng theo độ tuổi",
        data: Object.values(stats?.ageGroups || {}),
        backgroundColor: "rgba(153, 102, 255, 0.8)",
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Thống kê tổng quan</h2>
        <div className="bg-white rounded-lg shadow p-1 flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "overview"
                ? "bg-pink-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "ai"
                ? "bg-pink-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            AI & ML
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "analytics"
                ? "bg-pink-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Phân tích chi tiết
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tổng số người dùng */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tổng số người dùng
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalUsers}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Người dùng đã xác thực */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đã xác thực</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.verifiedUsers}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Người dùng đang online */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đang online</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.onlineUsers}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Người dùng mới hôm nay */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Người dùng mới hôm nay
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.todayNewUsers}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Tăng trưởng người dùng</h3>
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: stats?.userGrowth?.map((item) => item.date) || [],
                    datasets: [
                      {
                        label: "Số người dùng mới",
                        data:
                          stats?.userGrowth?.map((item) => item.count) ||
                          [],
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Gender Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Phân bố giới tính</h3>
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ["Nam", "Nữ", "Khác"],
                    datasets: [
                      {
                        data: [
                          stats?.genderDistribution?.male || 0,
                          stats?.genderDistribution?.female || 0,
                          stats?.genderDistribution?.other || 0,
                        ],
                        backgroundColor: [
                          "rgba(54, 162, 235, 0.6)",
                          "rgba(255, 99, 132, 0.6)",
                          "rgba(255, 206, 86, 0.6)",
                        ],
                        borderColor: [
                          "rgba(54, 162, 235, 1)",
                          "rgba(255, 99, 132, 1)",
                          "rgba(255, 206, 86, 1)",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Age Groups Chart */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Phân bố độ tuổi</h3>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: stats?.ageGroups
                      ? Object.keys(stats.ageGroups)
                      : [],
                    datasets: [
                      {
                        label: "Số người dùng",
                        data: stats?.ageGroups
                          ? Object.values(stats.ageGroups)
                          : [],
                        backgroundColor: "rgba(153, 102, 255, 0.6)",
                        borderColor: "rgba(153, 102, 255, 1)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "ai" && (
        <AIInsights className="mt-2" />
      )}

      {activeTab === "analytics" && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Tính năng phân tích chi tiết đang được phát triển.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
