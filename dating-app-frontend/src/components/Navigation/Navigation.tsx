import React, { useEffect } from 'react';
import UserLists from '../UserLists';

interface NavigationProps {
  showUserLists: boolean;
  setShowUserLists: React.Dispatch<React.SetStateAction<boolean>>;
  refresh?: boolean;
  onSelectUser: (userId: string) => void;
  unreadCount?: number;
}

const Navigation: React.FC<NavigationProps> = ({
  showUserLists,
  setShowUserLists,
  refresh = false,
  onSelectUser = () => {},
  unreadCount = 0
}) => {
  useEffect(() => {
    if (showUserLists) {
      document.body.classList.add("user-lists-open");
    } else {
      document.body.classList.remove("user-lists-open");
    }

    return () => {
      document.body.classList.remove("user-lists-open");
    };
  }, [showUserLists]);

  return (
    <>
      {/* Nút toggle chat trên mobile */}
      <button
        onClick={() => setShowUserLists(!showUserLists)}
        className="md:hidden fixed right-4 bottom-4 z-50 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <i className="fas fa-comments text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* UserLists sidebar */}
      <div
        className={`
          fixed md:static
          w-full md:w-[320px] lg:w-[350px] xl:w-[380px]
          h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]
          bg-white/95 backdrop-blur-lg
          shadow-2xl md:shadow-lg
          transition-all duration-500 ease-in-out
          ${showUserLists ? "right-0" : "-right-full"}
          md:translate-x-0
          z-40 md:z-auto
          overflow-hidden
        `} 
      >
        <UserLists
          refresh={refresh}
          onSelectUser={onSelectUser}
          onClose={() => setShowUserLists(false)}
        />
      </div>
    </>
  );
};

export default Navigation; 