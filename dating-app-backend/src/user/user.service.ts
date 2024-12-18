import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../email/email.service'; // Nhập EmailService
import { randomUUID } from 'crypto'; // Thêm import để tạo mã xác thực
import { VerifyUserDto } from './dto/verify-user.dto'; // Nhập VerifyUserDto
import { LocationService } from 'src/location-service/location-service.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService, // Thêm EmailService vào constructor
    private locationService: LocationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    file: any,
    createUserDto: CreateUserDto,
    ip: string,
  ): Promise<UserDocument> {
    console.log('DTO checked');
    console.log(createUserDto.name);
    // Lấy vị trí từ IP
    const location = await this.getUserLocation(ip); // Lấy vị trí từ IP

    // // Kiểm tra xem longitude và latitude có hợp lệ không
    if (!location.longitude || !location.latitude) {
      throw new HttpException(
        'Location could not be determined',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const verificationCode = randomUUID(); // Tạo mã xác thực

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10); // Băm mật khẩu với bcrypt
    let stringUrls = [];

    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      // stringUrls = await Promise.all(
      //   data.map(async (profilePicture) => {
      //     const result =
      //       await this.cloudinaryService.uploadFile(profilePicture);
      //     return result;
      //   }),
      // );
      stringUrls = [result.url];
    }

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword, // Lưu mật khẩu đã băm vào cơ sở dữ liệu
      location: {
        type: 'Point', // Đảm bảo rằng type được cung cấp
        coordinates: [location.longitude, location.latitude], // Sử dụng tọa độ từ vị trí
      },
      profilePictures: stringUrls,
      verificationCode, // Lưu mã xác thực vào cơ sở dữ liệu
    });

    // Gửi email xác thực
    await this.emailService.sendVerificationEmail(
      createUserDto.email,
      verificationCode,
    );

    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async verifyUser(
    userId: string,
    verifyUserDto: VerifyUserDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.verificationCode !== verifyUserDto.code) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isVerified = true; // Cập nhật trạng thái xác thực
    user.verificationCode = null; // Xóa mã xác thực sau khi xác thực thành công
    await user.save();

    // Trả về thông báo xác thực thành công
    return { message: 'User has been successfully verified.' };
  }

  async findNearbyUsers(userId: string, maxDistance: number): Promise<User[]> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        console.log('User not found:', userId);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!user.location?.coordinates) {
        console.log(
          'User location not found, falling back to city/district search',
        );
        // Fallback về tìm kiếm theo city/district nếu không có tọa độ
        return this.findUsersByCityDistrict(user);
      }

      console.log('Finding nearby users for:', user.name);
      console.log('Current user location:', user.location);

      const searchPreferences = await this.getSearchPreferences(userId);

      // Xây dựng query với $geoNear
      const baseQuery = {
        $and: [
          { _id: { $ne: userId } },
          { _id: { $nin: user.likedUsers } },
          {
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: user.location.coordinates,
                },
                $maxDistance: maxDistance * 1000, // Chuyển đổi km sang mét
              },
            },
          },
        ],
      };

      // Thêm điều kiện về giới tính và xu hướng tìm kiếm
      const genderPreferenceQuery = this.buildGenderPreferenceQuery(user);
      if (genderPreferenceQuery) {
        baseQuery.$and.push(genderPreferenceQuery);
      }

      const users = await this.userModel.find(baseQuery).lean().exec();

      console.log('Found nearby users:', users.length);

      // Tính điểm và sắp xếp kết quả
      const scoredUsers = users.map((matchUser) => {
        let totalScore = 0;
        let maxPossibleScore = 0;

        // Điểm cho khoảng cách (30 điểm)
        if (matchUser.location?.coordinates) {
          const distance = this.calculateDistance(
            user.location.coordinates,
            matchUser.location.coordinates,
          );
          const distanceScore = Math.max(0, 30 - (distance / maxDistance) * 30);
          totalScore += distanceScore;
          maxPossibleScore += 30;
        }

        // 1. Điểm cho sở thích chung (40 điểm)
        if (
          searchPreferences.prioritizeInterests &&
          user.interests &&
          matchUser.interests
        ) {
          const commonInterests = user.interests.filter((interest) =>
            matchUser.interests.includes(interest),
          );
          const maxInterests = Math.min(user.interests.length, 5); // Giới hạn tối a 5 sở thích
          const interestScore = (commonInterests.length / maxInterests) * 40;
          totalScore += interestScore;
          maxPossibleScore += 40;
        }

        // 2. Điểm cho độ tuổi gần nhau (25 điểm)
        if (searchPreferences.prioritizeAge && user.age && matchUser.age) {
          const ageDiff = Math.abs(user.age - matchUser.age);
          let ageScore = 0;
          if (ageDiff <= 3) ageScore = 25;
          else if (ageDiff <= 5) ageScore = 20;
          else if (ageDiff <= 8) ageScore = 15;
          else if (ageDiff <= 10) ageScore = 10;
          else if (ageDiff <= 15) ageScore = 5;
          totalScore += ageScore;
          maxPossibleScore += 25;
        }

        // 3. Điểm cho trình độ học vấn (15 điểm)
        if (
          searchPreferences.prioritizeEducation &&
          user.education &&
          matchUser.education
        ) {
          const educationScore =
            user.education === matchUser.education ? 15 : 0;
          totalScore += educationScore;
          maxPossibleScore += 15;
        }

        // 4. Điểm cho cung hoàng đạo (15 điểm)
        if (
          searchPreferences.prioritizeZodiac &&
          user.zodiacSign &&
          matchUser.zodiacSign
        ) {
          const zodiacCompatibility = this.checkZodiacCompatibility(
            user.zodiacSign,
            matchUser.zodiacSign,
          );
          const zodiacScore = (zodiacCompatibility / 3) * 15; // Chuyển đổi thang điểm 0-3 thành 0-15
          totalScore += zodiacScore;
          maxPossibleScore += 15;
        }

        // 5. Điểm cho người dùng online (5 điểm)
        if (searchPreferences.prioritizeOnline && matchUser.isOnline) {
          totalScore += 5;
          maxPossibleScore += 5;
        }

        const matchScore =
          maxPossibleScore > 0
            ? Math.round((totalScore / maxPossibleScore) * 100)
            : 0;

        const matchDetails = {
          ...this.calculateMatchDetails(user, matchUser),
          distance: this.calculateDistance(
            user.location.coordinates,
            matchUser.location.coordinates,
          ).toFixed(1), // Làm tròn đến 1 chữ số thập phân
        };

        return {
          ...matchUser,
          matchScore,
          matchDetails,
        };
      });

      return scoredUsers.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error in findNearbyUsers:', error);
      throw error;
    }
  }

  private buildGenderPreferenceQuery(user: User) {
    try {
      const genderQuery: any = {};

      if (!user.genderPreference || !user.gender) {
        return null;
      }

      if (user.genderPreference !== 'both') {
        genderQuery.gender = user.genderPreference;
      }

      genderQuery.$or = [
        { genderPreference: user.gender },
        { genderPreference: 'both' },
      ];

      return genderQuery;
    } catch (error) {
      console.error('Error building gender preference query:', error);
      return null;
    }
  }

  private checkZodiacCompatibility(sign1: string, sign2: string): number {
    // Định nghĩa các cung hoàng đạo tương thích
    const compatibilityMap: { [key: string]: string[] } = {
      'Bạch Dương': ['Sư Tử', 'Nhân Mã', 'Song Tử'],
      'Kim Ngưu': ['Xử Nữ', 'Ma Kết', 'Bọ Cạp'],
      'Song Tử': ['Bạch Dương', 'Thiên Bình', 'Bảo Bình'],
      'Cự Giải': ['Bọ Cạp', 'Song Ngư', 'Ma Kết'],
      'Sư Tử': ['Bạch Dương', 'Nhân Mã', 'Thiên Bình'],
      'Xử Nữ': ['Kim Ngưu', 'Ma Kết', 'Bọ Cạp'],
      'Thiên Bình': ['Song Tử', 'Bảo Bình', 'Sư Tử'],
      'Bọ Cạp': ['Cự Giải', 'Song Ngư', 'Kim Ngưu'],
      'Nhân Mã': ['Bạch Dương', 'Sư Tử', 'Bảo Bình'],
      'Ma Kết': ['Kim Ngưu', 'Xử Nữ', 'Bọ Cạp'],
      'Bảo Bình': ['Song Tử', 'Thiên Bình', 'Nhân Mã'],
      'Song Ngư': ['Cự Giải', 'Bọ Cạp', 'Ma Kết'],
    };

    // Kiểm tra tương thích
    if (compatibilityMap[sign1]?.includes(sign2)) {
      return 3; // Rất tương thích
    } else if (sign1 === sign2) {
      return 2; // Cùng cung
    }
    return 0; // Không tương thích đặc biệt
  }

  async updateUserLocation(
    userId: string,
    location: { type: string; coordinates: number[] },
  ): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { location },
      { new: true },
    );
  }

  // Thêm phương thức để lấy vị trí người dùng
  async getUserLocation(
    ip: string,
  ): Promise<{ longitude: number; latitude: number }> {
    try {
      // Sử dụng một dịch vụ bên ngoài để lấy vị trí từ IP
      const response = await this.locationService.getLocationByIP(ip);
      if (!response || !response.longitude || !response.latitude) {
        throw new Error('Không thể lấy vị trí từ IP');
      }
      return { longitude: response.longitude, latitude: response.latitude };
    } catch (error) {
      console.log(error);
      // Nếu có lỗi, trả về vị trí mặc định là Thành phố Hồ Chí Minh
      return { longitude: 106.6297, latitude: 10.8231 }; // Thành phố Hồ Chí Minh
    }
  }

  async hasLiked(userId: string, targetUserId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Giả sử bạn có một trường `likedUsers` trong mô hình người dùng để lưu danh sách người dùng mà họ đã thích
    return user.likedUsers.includes(targetUserId);
  }

  async sendNotification(
    targetUserId: string,
    message: string,
    type: string,
  ): Promise<void> {
    console.log('call notification function');
    console.log(targetUserId);
    await this.userModel.findByIdAndUpdate(targetUserId, {
      $push: {
        notification: {
          message,
          type,
          date: new Date(),
        },
      },
    });
  }

  async likeUser(userId: string, targetUserId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.likedUsers.includes(targetUserId)) {
      user.likedUsers.push(targetUserId); // Thêm targetUserId vào danh sách likedUsers
      await user.save();
    }

    // Cập nhật danh sách likedBy cho targetUser
    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser) {
      throw new HttpException('Target user not found', HttpStatus.NOT_FOUND);
    }

    if (!targetUser.likedBy.includes(user._id)) {
      targetUser.likedBy.push(user._id); // Thêm userId vào danh sách likedBy

      await targetUser.save();
    }

    // Kiểm tra xem người dùng đã thích nhau chưa
    if (targetUser.likedUsers.includes(userId)) {
      // Nếu cả hai người dùng đã thích nhau, thêm vào danh sách matchedUsers
      if (!user.matchedUsers.includes(targetUser._id)) {
        user.matchedUsers.push(targetUser._id);
        await user.save();
      }
      if (!targetUser.matchedUsers.includes(user._id)) {
        targetUser.matchedUsers.push(user._id);
        await targetUser.save();
      }
    }
  }

  async findById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async getLikedUsers(userId: string): Promise<UserDocument[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Lấy danh sách người dùng mà người dùng đã thích
    return this.userModel.find({ _id: { $in: user.likedUsers } }).exec();
  }

  async getUsersWhoLikedMe(userId: string): Promise<UserDocument[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Tìm kiếm những người dùng đã thích người dùng hiện tại
    return this.userModel.find({ _id: { $in: user.likedBy } }).exec();
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    files: Array<Express.Multer.File>,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    // Xử lý ảnh mới
    console.log('Check undefined');
    console.log(files);
    if (files && files.length > 0) {
      const newPictureUrls = await Promise.all(
        files.map(async (file) => {
          const result = await this.cloudinaryService.uploadFile(file);
          return result.url;
        }),
      );
      //Get current pictures
      const existingPictures = user.profilePictures || [];
      for (let i = 0; i <= updateUserDto.indexes.length; i++) {
        const updatedIndex = updateUserDto.indexes[i];
        if (parseInt(updatedIndex) + 1 > existingPictures.length) {
          user.profilePictures.push(newPictureUrls[i]);
        } else {
          user.profilePictures[parseInt(updatedIndex)] = newPictureUrls[i];
        }
      }
    }

    // Cập nhật các trường thông tin khác
    if (updateUserDto.age) user.age = updateUserDto.age;
    if (updateUserDto.zodiacSign) user.zodiacSign = updateUserDto.zodiacSign;
    if (updateUserDto.education) user.education = updateUserDto.education;
    if (updateUserDto.hobbies) user.hobbies = updateUserDto.hobbies;
    if (updateUserDto.gender) user.gender = updateUserDto.gender;
    if (updateUserDto.genderPreference)
      user.genderPreference = updateUserDto.genderPreference;
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.bio) user.bio = updateUserDto.bio;
    if (updateUserDto.interests) user.interests = updateUserDto.interests;

    return await user.save();
  }

  async setUserOnline(
    userId: string,
    isOnline: boolean,
  ): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(userId, { isOnline });
  }

  async setMatch(fromId, toId) {
    return this.userModel.findByIdAndUpdate(fromId, {
      $push: {
        matchedUsers: toId,
        likedBy: toId,
        likedUsers: toId,
      },
    });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async getMatchedUsers(userId: string): Promise<UserDocument[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException(
        'Không tìm thấy người dùng',
        HttpStatus.NOT_FOUND,
      );
    }

    // Lấy danh sách người dùng đã match với người dùng hiện tại
    return this.userModel.find({ _id: { $in: user.matchedUsers } }).exec();
  }

  // Thêm phương thức tìm kiếm người dùng phù hợp theo giới tính
  async findMatchingUsers(userId: string): Promise<User[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const query: any = {
      _id: { $ne: userId },
    };

    // Lọc theo giới tính preference
    if (user.genderPreference !== 'both') {
      query.gender = user.genderPreference;
    }

    // Lọc những người có preference phù hợp với giới tính của user
    query.$or = [
      { genderPreference: user.gender },
      { genderPreference: 'both' },
    ];

    return await this.userModel.find(query);
  }

  async updateLocation(userId: string, updateLocationDto: UpdateLocationDto) {
    const coordinates = await this.getCoordinatesFromLocation(
      updateLocationDto.city,
      updateLocationDto.district,
    );

    return this.userModel.findByIdAndUpdate(
      userId,
      {
        city: updateLocationDto.city,
        district: updateLocationDto.district,
        location: {
          type: 'Point',
          coordinates: coordinates,
        },
      },
      { new: true },
    );
  }

  private async getCoordinatesFromLocation(city: string, district: string) {
    // Sử dụng một service geocoding để lấy tọa độ từ tên thành phố/quận
    // Ví dụ: OpenStreetMap Nominatim API
    const query = `${district}, ${city}, Vietnam`;
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`,
    );

    if (response.data && response.data[0]) {
      return [
        parseFloat(response.data[0].lon),
        parseFloat(response.data[0].lat),
      ];
    }

    throw new HttpException(
      'Không tìm thấy tọa độ cho địa chỉ này',
      HttpStatus.NOT_FOUND,
    );
  }

  private async getSearchPreferences(userId: string): Promise<any> {
    try {
      // Lấy preferences từ database hoặc cache
      const preferences = await this.userModel
        .findById(userId)
        .select('searchPreferences');
      return (
        preferences?.searchPreferences || {
          prioritizeInterests: true,
          prioritizeAge: true,
          prioritizeEducation: true,
          prioritizeZodiac: true,
          prioritizeOnline: true,
        }
      );
    } catch (error) {
      console.error('Error getting search preferences:', error);
      // Trả về preferences mặc định nếu có lỗi
      return {
        prioritizeInterests: true,
        prioritizeAge: true,
        prioritizeEducation: true,
        prioritizeZodiac: true,
        prioritizeOnline: true,
      };
    }
  }

  // Thêm endpoint để cập nhật search preferences
  async updateSearchPreferences(
    userId: string,
    preferences: any,
  ): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { searchPreferences: preferences } },
      { new: true },
    );
  }

  // Hàm tính khoảng cách giữa 2 điểm (theo km)
  private calculateDistance(coords1: number[], coords2: number[]): number {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;

    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Fallback function khi không có tọa độ
  private async findUsersByCityDistrict(user: User): Promise<User[]> {
    const baseQuery = {
      $and: [
        { _id: { $ne: user._id } },
        { city: user.city },
        { district: user.district },
        { _id: { $nin: user.likedUsers } },
      ],
    };

    const genderPreferenceQuery = this.buildGenderPreferenceQuery(user);
    if (genderPreferenceQuery) {
      baseQuery.$and.push(genderPreferenceQuery);
    }

    return this.userModel.find(baseQuery).lean().exec();
  }

  // Tính toán chi tiết match
  private calculateMatchDetails(user: User, matchUser: User) {
    return {
      commonInterests:
        user.interests?.filter((i) => matchUser.interests?.includes(i)) || [],
      ageDifference: user.age
        ? Math.abs(user.age - (matchUser.age || 0))
        : null,
      sameEducation: user.education === matchUser.education,
      zodiacCompatibility:
        user.zodiacSign && matchUser.zodiacSign
          ? this.checkZodiacCompatibility(user.zodiacSign, matchUser.zodiacSign)
          : null,
      isOnline: matchUser.isOnline,
    };
  }
}
