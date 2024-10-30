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
    const user = await this.userModel.findById(userId);
    if (!user || !user.location) {
      throw new HttpException(
        'User not found or location not set',
        HttpStatus.NOT_FOUND,
      );
    }

    // Kiểm tra tọa độ của người dùng
    console.log('User Location:', user.location.coordinates);

    // Tìm kiếm người dùng gần
    const nearbyUsers = await this.userModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: user.location.coordinates,
            },
            $maxDistance: maxDistance, // Đơn vị là mét
          },
        },
        _id: { $ne: userId, $nin: user.likedUsers }, // Không tìm kiếm chính người dùng và những người đã thích
      })
      .exec();

    // Kiểm tra danh sách người dùng gần
    console.log('Nearby Users:', nearbyUsers);

    return nearbyUsers; // Trả về danh sách người dùng gần
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
    file: any,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }


    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      console.log("Cloudinary update: " + result);
      // stringUrls = await Promise.all(
      //   data.map(async (profilePicture) => {
      //     const result =
      //       await this.cloudinaryService.uploadFile(profilePicture);
      //     return result;
      //   }),
      // );
      user.profilePictures = [result.url];
    }
    // Cập nhật tên nếu có
    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    // Cập nhật mật khẩu nếu có
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10); // Băm mật khẩu mới
    }

    // Cập nhật sở thích nếu có
    if (updateUserDto.interests) {
      user.interests = updateUserDto.interests; // Cập nhật danh sách sở thích
    }

    // Cập nhật bio nếu có
    if (updateUserDto.bio) {
      user.bio = updateUserDto.bio; // Cập nhật thông tin tiểu sử
    }




    return user.save(); // Lưu thay đổi vào cơ sở dữ liệu
  }
  async setUserOnline(
    userId: string,
    isOnline: boolean,
  ): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(userId, { isOnline });
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
}
