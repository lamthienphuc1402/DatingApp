import axios from "axios";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ApproveNotice = ({ fromUserName, toUserName, socket }: any) => {
  const [toUser, setToUser] = useState<any>();
  const [fromUser, setFromUser] = useState<any>();
  console.log(fromUserName);
  console.log(toUserName);
  useEffect(() => {
    const fetchData = async () => {
      const [toUserRes, fromUserRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_LOCAL_API_URL}/users/${toUserName}`),
        axios.get(
          `${import.meta.env.VITE_LOCAL_API_URL}/users/${fromUserName}`
        ),
      ]);
      setToUser(toUserRes.data);
      setFromUser(fromUserRes.data);
    };
    fetchData();
  }, [toUserName, fromUserName]);

  const onClose = () => {
    const modal: any = document.getElementById("notice");
    socket.off("sendLike");
    socket.off("matchStatus");
    socket.off("matchApprove");

    if (modal) {
      modal.close();
    }
  };
  return (
    <dialog id="notice" className="p-6 rounded-lg shadow-xl bg-white">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          className="mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1 }}
        >
          <div className="relative flex justify-center items-center">
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-500 z-10"
              initial={{ scale: 0, y: 100 }}
              animate={{
                scale: 1,
                y: 0,
                transition: { type: "spring", bounce: 0.5 },
              }}
              whileHover={{ scale: 1.1 }}
            >
              <img
                src={fromUser?.profilePictures?.[0]}
                alt={fromUser?.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-500 ml-[-20px]"
              initial={{ scale: 0, y: -100 }}
              animate={{
                scale: 1,
                y: 0,
                transition: { type: "spring", bounce: 0.5, delay: 0.2 },
              }}
              whileHover={{ scale: 1.1 }}
            >
              <img
                src={toUser?.profilePictures?.[0]}
                alt={toUser?.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Thêm hiệu ứng pháo hoa */}
          <motion.div className="absolute top-0 left-0 right-0">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-pink-500 rounded-full"
                initial={{ y: 0, x: i * 50 - 50 }}
                animate={{
                  y: [-20, -60],
                  x: [i * 50 - 50, i * 50 - 50 + (i - 1) * 30],
                  scale: [1, 0],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>

          <motion.h3
            className="text-2xl font-bold text-gray-900 mb-2"
            initial={{ scale: 0 }}
            animate={{
              scale: [1, 1.1, 1],
              transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              },
            }}
          >
            🎉 Match thành công! 🎉
          </motion.h3>
          <p className="text-lg text-gray-600 mb-4">
            Bạn và {toUser?.name} đã match với nhau!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600 transition-colors shadow-lg"
          >
            Bắt đầu trò chuyện
          </motion.button>
        </motion.div>
      </motion.div>
    </dialog>
  );
};

export default ApproveNotice;
