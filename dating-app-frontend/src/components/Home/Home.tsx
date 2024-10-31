import {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import Chat from "../Chat";
import UserLists from "../UserLists";
import {SocketContext} from "../../SocketContext";
import {io} from "socket.io-client";
import ApproveModal from "./ApproveModal.tsx";
import ApproveNotice from "./ApproveNotice.tsx";

interface User {
    profilePictures: string[];
    _id: string;
    name: string;
    email: string;
    bio?: string;
    interests?: string[];
}

export type HomeType = {
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    isLoggedIn: boolean;
};

const Home = ({setIsLoggedIn, isLoggedIn}: HomeType) => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
    const [currentMatchId, setCurrentMatchId] = useState("")
    const [currentFromId, setCurrentFromId] = useState("")

    const {socket, setCurrentSocket}: any = useContext(SocketContext);

    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 6;

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(users.length / usersPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");
        if (token && userString) {
            setIsLoggedIn(true);
            try {
                const user = JSON.parse(userString);
                fetchUserIdAndNearbyUsers(token, user._id);
            } catch (error) {
                console.error("Lỗi khi parse thông tin người dùng:", error);
                // Xử lý lỗi, ví dụ: đăng xuất người dùng
                handleLogout();
            }
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        // Chuyển hướng người dùng về trang đăng nhập nếu cần
        // navigate("/login");
    };

    //Handle if user refresh
    useEffect(() => {
        if (!socket) {
            const user = JSON.parse(localStorage.getItem("user") || "");
            console.log(user._id);
            const refreshSocket = io(
                `${import.meta.env.VITE_LOCAL_API_URL}?userId=${user._id}`
            );
            setCurrentSocket(refreshSocket);
            setRefresh(true);
            return;
        } else {
            setRefresh(false);
        }
    }, [socket]);

    useEffect(() => {

        if (!socket) return;
        const user = JSON.parse(localStorage.getItem("user") || "");

        socket.on('matchApprove', (data: any) => {
            const matchData = JSON.parse(data);
            setCurrentMatchId(matchData.targetUserId);
            setCurrentFromId(matchData.fromUserId);
            if (matchData.targetUserId === user._id) {
                const modal: any = document.querySelector("#approveBox")
                if (modal)
                    modal.showModal();
                return;
            }
        })

        socket.on('matchStatus', (data: any) => {
            const approveModal: any = document.querySelector("#approveBox")
            if(approveModal) approveModal.close();
            const matchData = JSON.parse(data);
            setCurrentMatchId(matchData.targetUserId);
            setCurrentFromId(matchData.fromUserId);
            if (matchData.targetUserId === user._id || matchData.fromUserId === user._id) {

                const modal: any = document.querySelector("#notice")
                if (modal)
                    modal.showModal();
                return;
            }
        })
        return () => {
            socket.off('matchApprove');
            socket.off('sendLike');
        }
    }, [socket]);


    //Swipe user
    const fetchUserIdAndNearbyUsers = async (_token: string, userId: string) => {
        try {
            fetchNearbyUsers(userId);
        } catch (err) {
            setError("Không thể lấy thông tin người dùng.");
        }
    };

    //Chat
    const fetchNearbyUsers = async (userId: string) => {
        try {
            const response = await fetch(
                `http://localhost:3000/users/nearby/${userId}?maxDistance=1000`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError("Không thể lấy danh sách người dùng gần.");
        }
    };

    const handleLike = async (targetUserId: string) => {
        try {
            const userData = JSON.parse(localStorage.getItem("user") || "");
            const userId = userData._id;
            setCurrentIndex((prevIndex) => prevIndex + 1);
            socket.emit("sendLike", {currentUserId: userId, targetUserId, approveStatus: 'pending'});
        } catch (err) {
            console.error("Lỗi khi thích người dùng:", err);
        }
    };

    const handleDislike = () => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
    };

    const handleSelectUser = (userId: string) => {
        const user = users.find(user => user._id === userId);
        if (user) {
            setSelectedUser(user);
        } else {
            console.error("Không tìm thấy người dùng với ID:", userId);
        }
    };

    return (
        <>
            <ApproveNotice fromUser={currentFromId} toUser={currentMatchId} />
            <ApproveModal socket={socket} fromUser={currentFromId} targetUser={currentMatchId} />
            <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex">
                {isLoggedIn ? (
                    <>
                        <div className="w-1/3 bg-white p-4 overflow-y-auto">
                            <UserLists
                                refresh={refresh}
                                onSelectUser={handleSelectUser}
                            />
                        </div>
                        <div className="w-2/3 p-4">
                            <h1 className="text-2xl font-extrabold mb-6 text-gray-800 text-center bg-white p-4 rounded-lg shadow-lg">
                                Danh sách người dùng gần đây
                            </h1>
                            <div className="grid grid-cols-3 gap-6">
                                {currentUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        onClick={() => setSelectedProfile(user)}
                                        className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                                    >
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={user.profilePictures[0] || "https://via.placeholder.com/150"}
                                                alt={user.name}
                                                className="w-32 h-32 object-cover rounded-full border-4 border-pink-200 mb-4"
                                            />
                                            <h3 className="text-xl font-semibold text-gray-800 mb-2">{user.name}</h3>
                                            {user.bio && (
                                                <p className="text-gray-600 text-sm text-center line-clamp-3 mb-3">
                                                    {user.bio}
                                                </p>
                                            )}
                                            {!user.bio && (
                                                <p className="text-gray-400 text-sm italic text-center mb-3">
                                                    Chưa có tiểu sử
                                                </p>
                                            )}
                                        </div>

                                        {user.interests && user.interests.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                                {user.interests.slice(0, 3).map((interest, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full"
                                                    >
                          {interest}
                        </span>
                                                ))}
                                                {user.interests.length > 3 && (
                                                    <span className="text-gray-500 text-xs">
                          +{user.interests.length - 3}
                        </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center mt-6 gap-2">
                                {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`px-4 py-2 rounded-lg ${
                                            currentPage === page
                                                ? 'bg-gray-800 text-white'
                                                : 'bg-white text-pink-500 hover:bg-pink-100'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modal hiển thị thông tin chi tiết */}
                        {selectedProfile && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setSelectedProfile(null)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                      d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <img
                                            src={selectedProfile.profilePictures[0]}
                                            alt={selectedProfile.name}
                                            className="w-48 h-48 object-cover rounded-full mx-auto mb-4 border-4 border-pink-200"
                                        />
                                        <h2 className="text-2xl font-bold mb-2 text-black">{selectedProfile.name}</h2>
                                        {selectedProfile.bio && (
                                            <p className="text-gray-600 mb-4">{selectedProfile.bio}</p>
                                        )}
                                        {selectedProfile.interests && (
                                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                                {selectedProfile.interests.map((interest, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                                                    >
                          {interest}
                        </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-center space-x-4">
                                            <button
                                                onClick={() => {
                                                    handleDislike();
                                                    setSelectedProfile(null);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleLike(selectedProfile._id);
                                                    setSelectedProfile(null);
                                                }}
                                                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                                     viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Chat window */}
                        {selectedUser && (
                            <div
                                className="fixed bottom-0 right-0 w-1/3 h-1/2 bg-white shadow-lg rounded-tl-lg overflow-hidden">
                                <Chat
                                    userId={(() => {
                                        const userString = localStorage.getItem("user");
                                        if (userString) {
                                            try {
                                                const user = JSON.parse(userString);
                                                return user._id;
                                            } catch (error) {
                                                console.error("Lỗi khi parse thông tin người dùng:", error);
                                                return null;
                                            }
                                        }
                                        return null;
                                    })()}
                                    targetUserId={selectedUser._id}
                                    targetUserName={selectedUser.name}
                                    targetUserProfilePicture={selectedUser.profilePictures}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                            <h1 className="text-4xl font-bold mb-6 text-gray-800">
                                Chào mừng đến với Dating App!
                            </h1>
                            <p className="text-lg text-gray-600 mb-8">
                                Khám phá những kết nối mới và tìm kiếm tình yêu đích thực của bạn.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Đăng Nhập
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Đăng Ký
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Home;
