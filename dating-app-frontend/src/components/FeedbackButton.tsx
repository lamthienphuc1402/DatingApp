import React, { useState } from 'react';
import FeedbackForm from './FeedbackForm';

const FeedbackButton = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* Nút feedback */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 bg-white text-pink-500 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 z-50"
        title="Gửi phản hồi"
      >
        <i className="fas fa-comment-dots text-2xl"></i>
      </button>

      {/* Modal form feedback */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            
            <FeedbackForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton; 