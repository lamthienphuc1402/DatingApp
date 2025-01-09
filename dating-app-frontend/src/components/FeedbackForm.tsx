import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Feedback {
  _id: string;
  content: string;
  type: 'bug' | 'feature' | 'other';
  isResolved: boolean;
  adminResponse?: string;
  createdAt: string;
}

const FeedbackForm = ({ onClose }: { onClose?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyFeedbacks();
    }
  }, [activeTab]);

  const fetchMyFeedbacks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.get(
        `${import.meta.env.VITE_LOCAL_API_URL}/feedback/my-feedback/${user._id}`
      );
      setMyFeedbacks(response.data);
    } catch (err) {
      setError('Không thể tải phản hồi của bạn');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.post(
        `${import.meta.env.VITE_LOCAL_API_URL}/feedback`,
        { content, type, userId: user._id }
      );
      setSuccess(true);
      setContent('');
      setType('other');
      fetchMyFeedbacks(); // Refresh list after new submission
      if (onClose) {
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError('Không thể gửi phản hồi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg relative">
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <i className="fas fa-times text-xl"></i>
      </button>

      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === 'send'
              ? 'text-pink-500 border-b-2 border-pink-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('send')}
        >
          Gửi phản hồi
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'history'
              ? 'text-pink-500 border-b-2 border-pink-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Phản hồi của tôi
        </button>
      </div>

      {activeTab === 'send' ? (
        <>
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              Phản hồi của bạn đã được gửi thành công!
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Loại phản hồi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'bug' | 'feature' | 'other')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="bug">Báo lỗi</option>
                <option value="feature">Đề xuất tính năng</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Nội dung</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 min-h-[150px]"
                placeholder="Nhập nội dung phản hồi của bạn..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-4">
          {myFeedbacks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Bạn chưa gửi phản hồi nào.
            </p>
          ) : (
            myFeedbacks.map((feedback) => (
              <div
                key={feedback._id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-1 rounded text-sm ${
                    feedback.type === 'bug' ? 'bg-red-100 text-red-800' :
                    feedback.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {feedback.type === 'bug' ? 'Lỗi' :
                     feedback.type === 'feature' ? 'Tính năng' : 'Khác'}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    feedback.isResolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {feedback.isResolved ? 'Đã xử lý' : 'Đang xử lý'}
                  </span>
                </div>
                <p className="text-gray-700">{feedback.content}</p>
                {feedback.adminResponse && (
                  <div className="mt-2 pl-4 border-l-2 border-pink-300">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Phản hồi:</span> {feedback.adminResponse}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackForm; 