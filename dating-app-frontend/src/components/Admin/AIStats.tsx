import React from 'react';
import { Tooltip } from '../UI/Tooltip';

interface ModelStats {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface AIStatsProps {
  modelStats: ModelStats;
}

const AIStats: React.FC<AIStatsProps> = ({ modelStats }) => {
  const tooltips = {
    accuracy: "Độ chính xác tổng thể của model trong việc dự đoán match thành công. Ví dụ: 90% nghĩa là model dự đoán đúng 90/100 trường hợp.",
    precision: "Tỷ lệ dự đoán match thành công là đúng trên tổng số dự đoán match thành công. Ví dụ: 100% nghĩa là khi model dự đoán match thành công thì đều đúng.",
    recall: "Tỷ lệ match thành công được dự đoán đúng trên tổng số match thành công thực tế. Ví dụ: 33.33% nghĩa là model phát hiện được 1/3 số match thành công thực tế.",
    f1Score: "Điểm F1 là trung bình điều hòa của Precision và Recall, cho thấy sự cân bằng giữa hai chỉ số này. Ví dụ: 50% là mức cân bằng khá tốt."
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Hiệu suất của AI Model</h2>
      <div className="space-y-6">
        {/* Độ chính xác */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Độ chính xác</span>
              <Tooltip content={tooltips.accuracy}>
                <i className="fas fa-info-circle text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <span className="font-semibold">{modelStats.accuracy}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${modelStats.accuracy}%` }}
            />
          </div>
        </div>

        {/* Precision */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Precision</span>
              <Tooltip content={tooltips.precision}>
                <i className="fas fa-info-circle text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <span className="font-semibold">{modelStats.precision}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${modelStats.precision}%` }}
            />
          </div>
        </div>

        {/* Recall */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Recall</span>
              <Tooltip content={tooltips.recall}>
                <i className="fas fa-info-circle text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <span className="font-semibold">{modelStats.recall}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${modelStats.recall}%` }}
            />
          </div>
        </div>

        {/* F1 Score */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">F1 Score</span>
              <Tooltip content={tooltips.f1Score}>
                <i className="fas fa-info-circle text-gray-400 hover:text-gray-600 cursor-help" />
              </Tooltip>
            </div>
            <span className="font-semibold">{modelStats.f1Score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${modelStats.f1Score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStats; 