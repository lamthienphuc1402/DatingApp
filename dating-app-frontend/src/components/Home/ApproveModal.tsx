import { useEffect, useState } from "react";
import axios from "axios";


const ApproveModal = ({ fromUser, targetUser, socket }: any) => {
  if(!fromUser || !targetUser || fromUser === JSON.parse(localStorage.getItem("user") || "")?._id) {
    const modal: any = document.querySelector('#approveBox')
    if(modal) modal.close()
    return;
  }
    const [fromUserData, setFromUserData] = useState<any>();
    const [targetUserData, setTargetUserData] = useState<any>();
    console.log("from user: " + fromUserData);
    useEffect(() => {
  
      
        const fetchData = async () => {
            const [responseFromUser, responseTargetUser] = await Promise.all([
                await axios.get(`http://localhost:3000/users/${fromUser}`),
                await axios.get(`http://localhost:3000/users/${targetUser}`)
            ])
            setFromUserData(responseFromUser.data);
            setTargetUserData(responseTargetUser.data);
        }
        fetchData();
    }, [])

  const handleApprove = async () => {
    try {     
      // Sau khi cập nhật DB thành công, emit socket event
      socket.emit("sendLike", {
        currentUserId: targetUser,
        targetUserId: fromUser,
        approveStatus: "success"
      });
      const modal: any = document.querySelector('#approveBox')
      if(modal) modal.close()
    } catch (err) {
      console.error("Lỗi khi chấp nhận match:", err);
    }
  };

  const handleReject = () => {
    socket.emit("sendLike", {
      currentUserId: targetUser,
      targetUserId: fromUser,
      approveStatus: "rejected"
    });
    const modal: any = document.querySelector('#approveBox')
    if(modal) modal.close()
  };

  useEffect(() => {
    const modal: any = document.querySelector("#approveBox");
    if (modal) {
        modal.showModal();
    }
    return () => {
        if (modal) {
            modal.close();
        }
    };
  }, []);

  return (
    <dialog id="approveBox" className="p-6 rounded-lg shadow-xl bg-white">
      <div className="text-center">
        <div className="mb-4">
          {fromUserData?.profilePictures && fromUserData?.profilePictures[0] ? (
            <img 
              src={fromUserData?.profilePictures[0]} 
              alt={fromUserData?.name}
              className="w-24 h-24 mx-auto rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">{fromUserData?.name[0]}</span>
            </div>
          )}
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">{fromUserData?.name}</h3>
        {fromUserData?.bio && (
          <p className="text-sm text-gray-600 mb-4">{fromUserData?.bio}</p>
        )}
        <p className="text-sm text-gray-500 mb-4">
          muốn match với bạn. Bạn có muốn chấp nhận không?
        </p>
        <div className="flex justify-center gap-2">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
          >
            Từ chối
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            Chấp nhận
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ApproveModal;