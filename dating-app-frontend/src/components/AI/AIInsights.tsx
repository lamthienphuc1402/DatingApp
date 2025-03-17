import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Tooltip } from '../UI/Tooltip';
import { toast } from 'react-toastify';

interface AIModelStats {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedAt: string;
  samplesCount: number;
  version: string;
  metrics?: {
    accuracy: { description: string };
    precision: { description: string };
    recall: { description: string };
    f1Score: { description: string };
  };
}

interface AIInsightsProps {
  className?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ className }) => {
  const [modelStats, setModelStats] = useState<AIModelStats | null>(null);
  const [matchDistribution, setMatchDistribution] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);

  useEffect(() => {
    fetchModelStats();
    fetchMatchDistribution();
  }, []);

  const fetchModelStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/ai/model-stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      setModelStats(response.data);
    } catch (err) {
      setError('Không thể tải thông tin model. Có thể model chưa được đào tạo.');
      console.error('Lỗi khi tải thông tin model:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDistribution = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/ai/match-distribution`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      setMatchDistribution(response.data);
    } catch (err) {
      console.error('Lỗi khi tải phân phối match:', err);
    }
  };

  const handleTrainModel = async () => {
    try {
      setIsTraining(true);
      await axios.post(
        `${import.meta.env.VITE_LOCAL_API_URL}/ai/train`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      // Tải lại thông tin model sau khi train
      await fetchModelStats();
      await fetchMatchDistribution();
    } catch (err) {
      setError('Lỗi khi train model');
      console.error('Lỗi khi train model:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      setIsLoadingSamples(true);
      await axios.post(
        `${import.meta.env.VITE_LOCAL_API_URL}/ai/load-samples`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      toast.success('Đã tải dữ liệu mẫu thành công');
      // Tải lại thông tin sau khi có dữ liệu mẫu
      await fetchModelStats();
      await fetchMatchDistribution();
    } catch (err) {
      setError('Lỗi khi tải dữ liệu mẫu');
      console.error('Lỗi khi tải dữ liệu mẫu:', err);
      toast.error('Không thể tải dữ liệu mẫu');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const matchDistributionChartData = {
    labels: matchDistribution?.distribution ? Object.keys(matchDistribution.distribution) : [],
    datasets: [
      {
        label: 'Số lượng Match',
        data: matchDistribution?.distribution ? Object.values(matchDistribution.distribution) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const modelStatsChartData = {
    labels: ['Độ chính xác', 'Precision', 'Recall', 'F1 Score'],
    datasets: [
      {
        label: 'Hiệu suất Model',
        data: modelStats
          ? [
              modelStats.accuracy * 100,
              modelStats.precision * 100,
              modelStats.recall * 100,
              modelStats.f1Score * 100,
            ]
          : [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(201, 203, 207, 0.6)',
        ],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center my-5">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-gray-600">Đang tải thông tin AI...</p>
      </div>
    );
  }

  return (
    <div className={`ai-insights ${className || ''}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Thống kê AI</h2>

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Thông tin Model</h3>
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isLoadingSamples 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 transition duration-200'
                }`}
                onClick={handleLoadSampleData}
                disabled={isLoadingSamples}
              >
                {isLoadingSamples ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang tải...
                  </div>
                ) : 'Tải dữ liệu mẫu'}
              </button>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isTraining 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-pink-500 text-white hover:bg-pink-600 transition duration-200'
                }`}
                onClick={handleTrainModel}
                disabled={isTraining}
              >
                {isTraining ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang train...
                  </div>
                ) : 'Train lại Model'}
              </button>
            </div>
          </div>
          <div className="p-6">
            {modelStats ? (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Phiên bản</p>
                    <p className="font-semibold">{modelStats.version}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Số lượng mẫu</p>
                    <p className="font-semibold">{modelStats.samplesCount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Ngày train</p>
                    <p className="font-semibold">
                      {new Date(modelStats.trainedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Hiệu suất Model:</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center">
                        Độ chính xác
                        <Tooltip content={modelStats.metrics?.accuracy.description || ''}>
                          <i className="fas fa-info-circle ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </span>
                      <span className="text-sm font-medium">{(modelStats.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${modelStats.accuracy * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center">
                        Precision
                        <Tooltip content={modelStats.metrics?.precision.description || ''}>
                          <i className="fas fa-info-circle ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </span>
                      <span className="text-sm font-medium">{(modelStats.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${modelStats.precision * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center">
                        Recall
                        <Tooltip content={modelStats.metrics?.recall.description || ''}>
                          <i className="fas fa-info-circle ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </span>
                      <span className="text-sm font-medium">{(modelStats.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${modelStats.recall * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 flex items-center">
                        F1 Score
                        <Tooltip content={modelStats.metrics?.f1Score.description || ''}>
                          <i className="fas fa-info-circle ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </span>
                      <span className="text-sm font-medium">{(modelStats.f1Score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${modelStats.f1Score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Chưa có thông tin về Model AI. Vui lòng train model trước.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-700">Phân phối điểm Match</h3>
          </div>
          <div className="p-6">
            {matchDistribution ? (
              <div className="h-[300px]">
                <Doughnut
                  data={matchDistributionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      title: {
                        display: true,
                        text: 'Phân phối điểm Match',
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Chưa có dữ liệu về phân phối Match.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">Hiệu suất Model</h3>
        </div>
        <div className="p-6">
          {modelStats ? (
            <div className="h-[300px]">
              <Bar
                data={modelStatsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Phần trăm (%)',
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: 'Các chỉ số hiệu suất của Model',
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Chưa có dữ liệu về hiệu suất Model.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsights; 