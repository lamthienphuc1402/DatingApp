import { Controller, Post, Body, Get, Delete, Param, UseGuards, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  @ApiOperation({ summary: 'Tạo tài khoản admin mới' })
  @ApiResponse({ status: 201, description: 'Admin đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập admin' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ' })
  async login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.validateAdmin(
      loginAdminDto.username,
      loginAdminDto.password,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(AdminAuthGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê người dùng' })
  @ApiResponse({ status: 200, type: UserStatsDto })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @UseGuards(AdminAuthGuard)
  @Delete('users/:userId')
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiResponse({ status: 200, description: 'Người dùng đã được xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @UseGuards(AdminAuthGuard)
  @Get('all')
  @ApiOperation({ summary: 'Lấy danh sách quản trị viên' })
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @UseGuards(AdminAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin quản trị viên' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, updateAdminDto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa quản trị viên' })
  async deleteAdmin(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }
}
