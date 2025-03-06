import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

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

interface AIRecommendationsProps {
  users: User[];
  onSelectProfile: (user: User) => void;
  onLike: (userId: string) => void;
}

interface ZodiacElement {
  fire: number;
  air: number;
  earth: number;
  water: number;
}

interface ZodiacCompatibility {
  fire: ZodiacElement;
  earth: ZodiacElement;
  air: ZodiacElement;
  water: ZodiacElement;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ users, onSelectProfile, onLike }) => {
  const [recommendations, setRecommendations] = useState<(User & { aiScore: number; aiReason: string })[]>([]);
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  useEffect(() => {
    initModel();
  }, []);

  useEffect(() => {
    if (model) {
      processUsers();
    }
  }, [users, model]);

  const initModel = async () => {
    // Tạo mô hình neural network đơn giản
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    setModel(model);
  };

  const vectorizeUser = (user: User, currentUser: any) => {
    // Chuẩn hóa các đặc trưng thành vector
    const features = tf.tidy(() => {
      // 1. Khoảng cách - chuẩn hóa về [0,1]
      const normalizedDistance = user.distance ? Math.min(user.distance / 100, 1) : 1;

      // 2. Độ tuổi - chuẩn hóa về [-1,1]
      const ageDiff = Math.abs((user.age || 0) - (currentUser.age || 0)) / 20;
      const normalizedAge = Math.max(0, 1 - ageDiff);

      // 3. Sở thích chung - tỷ lệ sở thích trùng
      const commonInterests = user.interests?.filter(interest => 
        currentUser.interests?.includes(interest)
      ).length || 0;
      const interestScore = commonInterests / Math.max(user.interests?.length || 1, currentUser.interests?.length || 1);

      // 4. Giới tính phù hợp [0,1]
      const genderMatch = user.gender === currentUser.genderPreference || currentUser.genderPreference === 'both' ? 1 : 0;

      // 5. Học vấn giống nhau [0,1]
      const educationMatch = user.education === currentUser.education ? 1 : 0;

      // 6. Cung hoàng đạo tương thích [0,1]
      const zodiacMatch = calculateZodiacCompatibility(user.zodiacSign, currentUser.zodiacSign);

      // 7. Vector hóa sở thích
      const interestVector = vectorizeInterests(user.interests, currentUser.interests);

      // 8. Vector hóa vị trí
      const locationVector = user.location && currentUser.location ? 
        calculateLocationSimilarity(user.location.coordinates, currentUser.location.coordinates) : 0;

      // 9. Phân tích văn bản bio
      const bioSimilarity = calculateBioSimilarity(user.bio || '', currentUser.bio || '');

      // 10. Hobbies similarity
      const hobbiesSimilarity = calculateHobbiesSimilarity(user.hobbies || '', currentUser.hobbies || '');

      // Kết hợp tất cả features thành một tensor
      return tf.tensor2d([[
        normalizedDistance,
        normalizedAge,
        interestScore,
        genderMatch,
        educationMatch,
        zodiacMatch,
        ...interestVector.slice(0, 2), // Lấy 2 giá trị đầu từ vector sở thích
        locationVector,
        bioSimilarity
      ]]);
    });

    return features;
  };

  const calculateZodiacCompatibility = (zodiac1: string, zodiac2: string): number => {
    const zodiacGroups = {
      fire: ['Aries', 'Leo', 'Sagittarius'],
      earth: ['Taurus', 'Virgo', 'Capricorn'],
      air: ['Gemini', 'Libra', 'Aquarius'],
      water: ['Cancer', 'Scorpio', 'Pisces']
    };

    const getElement = (zodiac: string): keyof ZodiacCompatibility | null => {
      for (const [element, signs] of Object.entries(zodiacGroups)) {
        if (signs.includes(zodiac)) return element as keyof ZodiacCompatibility;
      }
      return null;
    };

    const element1 = getElement(zodiac1);
    const element2 = getElement(zodiac2);

    if (!element1 || !element2) return 0.5;

    const compatibility: ZodiacCompatibility = {
      fire: { fire: 1, air: 1, earth: 0.5, water: 0.3 },
      earth: { earth: 1, water: 1, fire: 0.5, air: 0.3 },
      air: { air: 1, fire: 1, water: 0.5, earth: 0.3 },
      water: { water: 1, earth: 1, air: 0.5, fire: 0.3 }
    };

    return compatibility[element1][element2];
  };

  const vectorizeInterests = (interests1: string[], interests2: string[]): number[] => {
    const allInterests = new Set([...interests1, ...interests2]);
    const vector1 = Array.from(allInterests).map(interest => interests1.includes(interest) ? 1 : 0);
    const vector2 = Array.from(allInterests).map(interest => interests2.includes(interest) ? 1 : 0);
    
    // Tính cosine similarity
    const dotProduct = vector1.reduce<number>((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce<number>((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce<number>((sum, val) => sum + val * val, 0));
    
    const similarity = magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    
    return [similarity, Math.min(interests1.length, interests2.length) / Math.max(interests1.length, interests2.length)];
  };

  const calculateLocationSimilarity = (coords1: number[], coords2: number[]): number => {
    // Haversine formula để tính khoảng cách
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coords1[0] * Math.PI / 180) * Math.cos(coords2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Chuẩn hóa khoảng cách về [0,1], với 100km là ngưỡng tối đa
    return Math.max(0, 1 - distance / 100);
  };

  const calculateBioSimilarity = (bio1: string, bio2: string): number => {
    const words1 = new Set(bio1.toLowerCase().split(/\s+/));
    const words2 = new Set(bio2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const calculateHobbiesSimilarity = (hobbies1: string, hobbies2: string): number => {
    const words1 = new Set(hobbies1.toLowerCase().split(/\s+/));
    const words2 = new Set(hobbies2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const getAIReason = (user: User, score: number, currentUser: any) => {
    const reasons = [];

    // Phân tích các yếu tố đóng góp vào điểm số
    const commonInterests = user.interests?.filter(interest => 
      currentUser.interests?.includes(interest)
    );
    if (commonInterests?.length > 0) {
      reasons.push(`Có ${commonInterests.length} sở thích chung: ${commonInterests.slice(0, 2).join(', ')}${commonInterests.length > 2 ? ',...' : ''}`);
    }

    if (user.distance && user.distance < 10) {
      reasons.push(`Ở gần bạn (${user.distance.toFixed(1)}km)`);
    }

    const ageDiff = Math.abs((user.age || 0) - (currentUser.age || 0));
    if (ageDiff <= 5) {
      reasons.push('Độ tuổi phù hợp');
    }

    if (user.education === currentUser.education) {
      reasons.push('Trình độ học vấn tương đồng');
    }

    const zodiacMatch = calculateZodiacCompatibility(user.zodiacSign, currentUser.zodiacSign);
    if (zodiacMatch > 0.7) {
      reasons.push('Cung hoàng đạo tương thích');
    }

    // Phân tích bio và hobbies
    const bioSimilarity = calculateBioSimilarity(user.bio || '', currentUser.bio || '');
    const hobbiesSimilarity = calculateHobbiesSimilarity(user.hobbies || '', currentUser.hobbies || '');
    if (bioSimilarity > 0.3 || hobbiesSimilarity > 0.3) {
      reasons.push('Có nhiều điểm chung trong sở thích và phong cách sống');
    }

    return reasons.join(' • ') || 'Người dùng có thể phù hợp với bạn';
  };

  const processUsers = async () => {
    if (!model) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Xử lý từng user bằng TensorFlow
    const processedUsers = await Promise.all(users.map(async (user) => {
      // Bỏ qua người dùng hiện tại
      if (user._id === currentUser._id) return null;

      const features = vectorizeUser(user, currentUser);
      
      // Dự đoán điểm phù hợp
      const prediction = await model.predict(features) as tf.Tensor;
      const score = (await prediction.data())[0];
      
      // Giải phóng tensors
      tf.dispose([features, prediction]);

      return {
        ...user,
        aiScore: Math.round(score * 100),
        aiReason: getAIReason(user, score, currentUser)
      };
    }));

    // Lọc bỏ null và sắp xếp theo điểm số
    const validUsers = processedUsers.filter(user => user !== null);
    validUsers.sort((a, b) => b!.aiScore - a!.aiScore);

    setRecommendations(validUsers as (User & { aiScore: number; aiReason: string })[]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {recommendations.map((user) => (
        <div
          key={user._id}
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="relative">
            <img
              src={user.profilePictures[0] || 'https://via.placeholder.com/300'}
              alt={user.name}
              className="w-full h-64 object-cover"
              onClick={() => onSelectProfile(user)}
            />
            <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full">
              {user.aiScore}% phù hợp
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {user.name}, {user.age}
                </h3>
                <p className="text-gray-500">
                  {user.city}, {user.district}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-purple-600 mb-2">
                Lý do đề xuất:
              </h4>
              <p className="text-gray-600">{user.aiReason}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {user.interests?.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
              {user.interests?.length > 3 && (
                <span className="text-gray-500 text-sm">
                  +{user.interests.length - 3}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => onSelectProfile(user)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Xem chi tiết
              </button>
              <button
                onClick={() => onLike(user._id)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-colors"
              >
                <i className="fas fa-heart"></i>
                Thích
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIRecommendations; 