import React, { useEffect, useState } from 'react';
import { Card, Progress, Tag, Typography, Spin } from 'antd';
import { HeartFilled, MessageOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AIInsightsProps {
  userId: string;
  matchId: string;
}

interface InsightData {
  compatibility: {
    score: number;
    level: string;
  };
  chatAnalysis: {
    sentiment: number;
    keywords: Array<{ word: string; count: number }>;
    interaction: {
      frequency: number;
      responseTime: number;
      engagement: number;
    };
  };
}

const AIInsights: React.FC<AIInsightsProps> = ({ userId, matchId }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_LOCAL_API_URL}/ai/insights/${userId}/${matchId}`,
          {
            credentials: 'include',
          }
        );
        const data = await response.json();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [userId, matchId]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!insights) {
    return <Text>Không thể tải thông tin AI</Text>;
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return '#52c41a';
    if (sentiment < -0.5) return '#f5222d';
    return '#faad14';
  };

  const formatResponseTime = (ms: number) => {
    const minutes = Math.floor(ms / (60 * 1000));
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    return `${hours} giờ`;
  };

  return (
    <div className="ai-insights" style={{ padding: '20px' }}>
      <Card title={<Title level={4}>Phân Tích AI</Title>}>
        {/* Điểm tương thích */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Độ Tương Thích</Text>
          <Progress
            percent={insights.compatibility.score}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Tag color="blue">{insights.compatibility.level}</Tag>
        </div>

        {/* Phân tích cảm xúc */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Cảm Xúc Trò Chuyện</Text>
          <Progress
            percent={Math.abs(insights.chatAnalysis.sentiment * 100)}
            strokeColor={getSentimentColor(insights.chatAnalysis.sentiment)}
            format={() => 
              insights.chatAnalysis.sentiment > 0 ? 'Tích cực' : 
              insights.chatAnalysis.sentiment < 0 ? 'Tiêu cực' : 'Trung lập'
            }
          />
        </div>

        {/* Từ khóa phổ biến */}
        <div style={{ marginBottom: '20px' }}>
          <Text strong>Từ Khóa Phổ Biến</Text>
          <div style={{ marginTop: '10px' }}>
            {insights.chatAnalysis.keywords.slice(0, 5).map((keyword, index) => (
              <Tag key={index} color="processing" style={{ margin: '2px' }}>
                {keyword.word}
              </Tag>
            ))}
          </div>
        </div>

        {/* Chỉ số tương tác */}
        <div>
          <Text strong>Chỉ Số Tương Tác</Text>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <MessageOutlined style={{ marginRight: '8px' }} />
              <Text>Tần suất nhắn tin: {insights.chatAnalysis.interaction.frequency.toFixed(1)} tin/giờ</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <ClockCircleOutlined style={{ marginRight: '8px' }} />
              <Text>Thời gian phản hồi trung bình: {formatResponseTime(insights.chatAnalysis.interaction.responseTime)}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <HeartFilled style={{ marginRight: '8px', color: '#ff4d4f' }} />
              <Text>Mức độ gắn kết: {insights.chatAnalysis.interaction.engagement.toFixed(0)}%</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIInsights; 