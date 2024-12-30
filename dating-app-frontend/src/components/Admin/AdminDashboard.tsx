import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu cho biểu đồ tăng trưởng người dùng
  const userGrowthData = {
    labels: stats?.userGrowth?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Số người dùng mới',
        data: stats?.userGrowth?.map(item => item.count) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  // Dữ liệu cho biểu đồ phân bố giới tính
  const genderData = {
    labels: ['Nam', 'Nữ', 'Khác'],
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
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
      },
    ],
  };

  // Dữ liệu cho biểu đồ nhóm tuổi
  const ageGroupData = {
    labels: Object.keys(stats?.ageGroups || {}),
    datasets: [
      {
        label: 'Số người dùng theo độ tuổi',
        data: Object.values(stats?.ageGroups || {}),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
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
      <h2 className="text-2xl font-bold text-gray-800">Thống kê tổng quan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tổng số người dùng */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng số người dùng</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <i className="fas fa-users text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Người dùng đã xác thực */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã xác thực</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.verifiedUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Người dùng đang online */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang online</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.onlineUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <i className="fas fa-circle text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        {/* Người dùng mới hôm nay */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Người dùng mới hôm nay</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.todayNewUsers}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <i className="fas fa-user-plus text-yellow-600 text-xl"></i>
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
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
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
              data={genderData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
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
              data={ageGroupData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 