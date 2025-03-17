import React, { useEffect, useState } from 'react';
import { aiService } from '../../services/aiService';

interface CompatibilityScoreProps {
  userId: string;
  targetUserId: string;
  showDetails?: boolean;
}

const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({ 
  userId, 
  targetUserId,
  showDetails = false
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    if (!userId || !targetUserId) return;
    
    const loadCompatibilityData = async () => {
      try {
        setLoading(true);
        const scoreData = await aiService.getCompatibility(userId, targetUserId);
        setScore(scoreData);
        
        if (showDetails) {
          const insightsData = await aiService.getMatchingInsights(userId, targetUserId);
          setInsights(insightsData);
        }
      } catch (error) {
        console.error('Lỗi khi tính điểm tương thích:', error);
        setScore(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompatibilityData();
  }, [userId, targetUserId, showDetails]);

  const getColorByScore = (score: number) => {
    if (score >= 0.7) return 'bg-green-500'; // Tương thích cao
    if (score >= 0.4) return 'bg-yellow-500'; // Tương thích trung bình
    return 'bg-red-500'; // Tương thích thấp
  };

  const getTextColorByScore = (score: number) => {
    if (score >= 0.7) return 'text-green-500'; // Tương thích cao
    if (score >= 0.4) return 'text-yellow-500'; // Tương thích trung bình
    return 'text-red-500'; // Tương thích thấp
  };

  if (loading) {
    return (
      <div className="p-2 flex justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-200"></div>
      </div>
    );
  }

  if (score === null) {
    return null;
  }

  const percentage = Math.round(score * 100);
  
  // Mini version for cards
  if (!showDetails) {
    return (
      <div className={`rounded-full w-12 h-12 flex items-center justify-center font-bold text-white ${getColorByScore(score)}`}>
        {percentage}%
      </div>
    );
  }

  // Detailed version
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="text-center mb-4">
        <div className="mx-auto relative" style={{ width: '120px', height: '120px' }}>
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path
              className="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#eee"
              strokeWidth="2"
            />
            <path
              className="circle"
              strokeDasharray={`${percentage}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={score >= 0.7 ? '#48bb78' : score >= 0.4 ? '#ecc94b' : '#f56565'}
              strokeWidth="2"
            />
            <text
              x="18"
              y="20.35"
              className={`percentage ${getTextColorByScore(score)}`}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
            >
              {percentage}%
            </text>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mt-2">Độ tương thích</h3>
      </div>

      {insights && (
        <div className="mt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Chi tiết tương thích:</h4>
          <ul className="space-y-2">
            {insights.interestScore !== undefined && (
              <li className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sở thích:</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.round(insights.interestScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(insights.interestScore * 100)}%</span>
                </div>
              </li>
            )}
            {insights.ageScore !== undefined && (
              <li className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Độ tuổi:</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${Math.round(insights.ageScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(insights.ageScore * 100)}%</span>
                </div>
              </li>
            )}
            {insights.distanceScore !== undefined && (
              <li className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Khoảng cách:</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.round(insights.distanceScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(insights.distanceScore * 100)}%</span>
                </div>
              </li>
            )}
            {insights.zodiacScore !== undefined && (
              <li className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cung hoàng đạo:</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full" 
                      style={{ width: `${Math.round(insights.zodiacScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(insights.zodiacScore * 100)}%</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}

      <style>
        {`
          .circular-chart {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
          }
          .circle-bg {
            stroke-width: 2;
            fill: none;
          }
          .circle {
            transition: stroke-dasharray 0.5s ease;
            stroke-width: 2;
            stroke-linecap: round;
            fill: none;
          }
          .percentage {
            font-family: sans-serif;
            font-size: 0.5em;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: middle;
            alignment-baseline: middle;
          }
        `}
      </style>
    </div>
  );
};

export default CompatibilityScore; 