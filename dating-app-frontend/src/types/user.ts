export interface User {
  _id: string;
  name: string;
  email: string;
  profilePictures: string[];
  bio: string;
  interests: string[];
  isOnline?: boolean;
  age: number;
  zodiacSign: string;
  education: string;
  hobbies: string;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'both';
}

export interface UserData {
  name: string;
  email: string;
  bio: string;
  interests: string;
  profilePictures: string[];
  age: number;
  zodiacSign: string;
  education: string;
  hobbies: string;
  gender: 'male' | 'female' | 'other';
  genderPreference: 'male' | 'female' | 'both';
} 