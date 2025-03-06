import React from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  bio: string;
  interests: string[];
  profilePictures: string[];
  age: number;
  zodiacSign: string;
  education: string;
  hobbies: string;
  gender: "male" | "female" | "other";
  genderPreference: "male" | "female" | "both";
  city?: string;
  district?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  matchScore?: number;
  distance?: number;
}

interface ListViewProps {
  currentUsers: User[];
  onSelectProfile: (user: User) => void;
}

const ListView: React.FC<ListViewProps> = ({ currentUsers, onSelectProfile }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 2xl:gap-8">
      {currentUsers.map((user) => (
        <div
          key={user._id}
          onClick={() => onSelectProfile(user)}
          className="bg-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
        >
          <div className="flex flex-col items-center">
            <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-full text-sm">
              {user.matchScore}% phù hợp
            </div>
            <img
              src={
                user.profilePictures[0] ||
                "https://via.placeholder.com/150"
              }
              alt={user.name}
              className="w-32 h-32 object-cover rounded-full border-4 border-pink-200 mb-4"
            />
            {user.age && (
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {user.name}, {user.age}
              </h3>
            )}
            {!user.age && (
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {user.name}
              </h3>
            )}
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
  );
};

export default ListView; 