import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const ApproveModal = ({ fromUser, targetUser, socket }: any) => {
  if(!fromUser || !targetUser || fromUser === JSON.parse(localStorage.getItem("user") || "")?._id) {
    const modal: any = document.querySelector('#approveBox')
    if(modal) modal.close()
    return;
  }
    const [fromUserData, setFromUserData] = useState<any>();
    const [targetUserData, setTargetUserData] = useState<any>();
    console.log("from user: ");
    
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
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <motion.div 
          className="mb-4"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {fromUserData?.profilePictures && fromUserData?.profilePictures[0] ? (
            <img 
              src={fromUserData?.profilePictures[0]} 
              alt={fromUserData?.name}
              className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-pink-500"
            />
          ) : (
            <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">{fromUserData?.name[0]}</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{fromUserData?.name}</h3>
          {fromUserData?.bio && (
            <p className="text-lg text-gray-600 mb-4">{fromUserData?.bio}</p>
          )}
          <p className="text-lg text-gray-500 mb-6">
            muốn match với bạn. Bạn có muốn chấp nhận không?
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReject}
              className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors shadow-lg"
            >
              Từ chối
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApprove}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600 transition-colors shadow-lg"
            >
              Chấp nhận
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </dialog>
  );
};

export default ApproveModal;