import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schema/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { User } from '../user/schema/user.schema';
import { MLService } from '../ai/services/ml.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private userService: UserService,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mlService: MLService,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);
    const createdAdmin = new this.adminModel({
      ...createAdminDto,
      password: hashedPassword,
    });
    return createdAdmin.save();
  }

  async validateAdmin(username: string, password: string) {
    const admin = await this.adminModel.findOne({ username });
    if (!admin) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const payload = { 
      sub: admin._id, 
      username: admin.username,
      role: 'admin'
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getAllUsers() {
    return this.userService.findAll();
  }

  async getUserStats() {
    const totalUsers = await this.userService.countUsers();
    const verifiedUsers = await this.userService.countVerifiedUsers();
    const onlineUsers = await this.userService.countOnlineUsers();
    const todayNewUsers = await this.userService.countTodayNewUsers();

    const userGrowth = await this.userService.getUserGrowth();

    const genderDistribution = await this.userService.getGenderDistribution();

    const ageGroups = await this.userService.getAgeGroups();

    return {
      totalUsers,
      verifiedUsers,
      onlineUsers,
      todayNewUsers,
      userGrowth,
      genderDistribution,
      ageGroups,
    };
  }

  async deleteUser(userId: string) {
    return this.userService.deleteUser(userId);
  }

  async getAllAdmins() {
    return this.adminModel.find().select('-password');
  }

  async updateAdmin(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminModel.findById(id);
    if (!admin) {
      throw new NotFoundException('Không tìm thấy quản trị viên');
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    return this.adminModel.findByIdAndUpdate(
      id,
      { $set: updateAdminDto },
      { new: true }
    ).select('-password');
  }

  async deleteAdmin(id: string) {
    const admin = await this.adminModel.findById(id);
    if (!admin) {
      throw new NotFoundException('Không tìm thấy quản trị viên');
    }

    // Không cho phép xóa admin cuối cùng
    const adminCount = await this.adminModel.countDocuments();
    if (adminCount <= 1) {
      throw new Error('Không thể xóa quản trị viên cuối cùng');
    }

    return this.adminModel.findByIdAndDelete(id);
  }

  async getModelStats() {
    return this.mlService.getModelStats();
  }

  async getMatchDistribution() {
    return this.mlService.getMatchDistribution();
  }

  async trainModel() {
    return this.mlService.trainModel();
  }
}
