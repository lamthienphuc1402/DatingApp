import axios from "axios";
import { useEffect, useState } from "react";

const ApproveNotice = ({ fromUserName, toUserName, socket }: any) => {
 const [toUser, setToUser] = useState<any>();
  useEffect(() => {
    const fetchData = async () => {
        const response = await axios.get(`http://localhost:3000/users/${toUserName}`);
        setToUser(response.data);
    }
    fetchData();
  }, [toUserName])

  const onClose = () => {
    const modal: any = document.getElementById('notice');
    socket.off('sendLike')
    socket.off('matchStatus')
    socket.off('matchApprove')

    if (modal) {
      modal.close();
    }
    
  }
  return (
    <dialog id="notice" className="p-6 rounded-lg shadow-xl bg-white">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Match thành công!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Bạn và {toUser?.name} đã match thành công.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
        >
          Đóng
        </button>
      </div>
    </dialog>
  );
};

export default ApproveNotice;