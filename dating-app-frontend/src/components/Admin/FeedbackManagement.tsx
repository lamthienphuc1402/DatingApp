import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Feedback {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePictures: string[];
  };
  content: string;
  type: 'bug' | 'feature' | 'other';
  isResolved: boolean;
  adminResponse?: string;
  createdAt: string;
}

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      setFeedbacks(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_LOCAL_API_URL}/feedback/${feedbackId}/respond`,
        { response },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      toast.success('Đã trả lời phản hồi');
      setResponse('');
      setSelectedFeedback(null);
      fetchFeedbacks();
    } catch (error) {
      toast.error('Không thể gửi phản hồi');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Quản lý phản hồi</h2>
      <div className="grid gap-4">
        {feedbacks.map((feedback) => (
          <div
            key={feedback._id}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex items-start gap-4">
              <img
                src={feedback.userId.profilePictures[0] || '/default-avatar.png'}
                alt={feedback.userId.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{feedback.userId.name}</h3>
                    <p className="text-sm text-gray-500">{feedback.userId.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    feedback.isResolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {feedback.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    feedback.type === 'bug' ? 'bg-red-100 text-red-800' :
                    feedback.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {feedback.type === 'bug' ? 'Lỗi' :
                     feedback.type === 'feature' ? 'Tính năng' : 'Khác'}
                  </span>
                </div>
                <p className="mt-2">{feedback.content}</p>
                {feedback.adminResponse && (
                  <div className="mt-2 pl-4 border-l-2 border-purple-300">
                    <p className="text-sm text-gray-600">Phản hồi: {feedback.adminResponse}</p>
                  </div>
                )}
                {!feedback.isResolved && (
                  <div className="mt-4">
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Nhập phản hồi của bạn..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                    />
                    <button
                      onClick={() => handleRespond(feedback._id)}
                      className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Gửi phản hồi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackManagement; 