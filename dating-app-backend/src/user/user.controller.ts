import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Put,
  Param,
  Get,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from '../auth/auth.service';
import { VerifyUserDto } from './dto/verify-user.dto'; // Nhập VerifyUserDto
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LikeUserDto } from './dto/like-user.dto'; // Nhập LikeUserDto
import { UpdateUserDto } from './dto/update-user.dto'; // Nhập DTO mới
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('profilePictures'))
  async register(
    @UploadedFile() file,
    @Body() createUserDto: CreateUserDto,
    @Request() req,
  ) {
    console.log('File: ');
    console.log(file);
    return this.userService.create(file, createUserDto, req.ip); // Truyền IP vào UserService
  }

  @Post('login')
  async login(@Body() loginDto: LoginUserDto, @Request() req) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await this.userService.validatePassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.authService.login(loginDto);
    const location = await this.userService.getUserLocation(req.ip); // Lấy vị trí từ IP
    await this.userService.updateUserLocation(user._id.toString(), {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    });
    return { message: 'Login successful', user, token };
  }

  @Post('request-location')
  @ApiOperation({ summary: 'Yêu cầu vị trí của người dùng' })
  @ApiResponse({ status: 200, description: 'Vị trí đã được lấy thành công' })
  @ApiResponse({ status: 400, description: 'Yêu cầu không hợp lệ' })
  async requestLocation(@Request() req) {
    const location = await this.userService.getUserLocation(req.ip);
    return { location };
  }

  @Get('nearby/:userId')
  @ApiOperation({ summary: 'Tìm người dùng gần theo vị trí và sở thích' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng gần' })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy' })
  async findNearbyUsers(
    @Param('userId') userId: string,
    @Query('maxDistance') maxDistance: number,
  ) {
    return this.userService.findNearbyUsers(userId, maxDistance);
  }

  @Post('verify/:userId')
  @ApiResponse({ status: 200, description: 'User verified successfully.' })
  async verifyUser(
    @Param('userId') userId: string,
    @Body() verifyUserDto: VerifyUserDto,
  ) {
    return this.userService.verifyUser(userId, verifyUserDto);
  }

  @Post('like')
  @ApiOperation({ summary: 'Thích một người dùng' })
  @ApiResponse({ status: 200, description: 'Thích người dùng thành công.' })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy.' })
  async likeUser(@Body() likeUserDto: LikeUserDto) {
    return this.userService.likeUser(
      likeUserDto.userId,
      likeUserDto.targetUserId,
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy' })
  async getUserById(@Param('userId') userId: string) {
    return this.userService.findById(userId);
  }

  @Get(':userId/liked-users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã thích' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng đã thích' })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy' })
  async getLikedUsers(@Param('userId') userId: string) {
    return this.userService.getLikedUsers(userId);
  }

  @Get(':userId/liked-by')
  @ApiOperation({ summary: 'Lấy danh sách người dùng đã thích mình' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng đã thích mình',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy' })
  async getUsersWhoLikedMe(@Param('userId') userId: string) {
    return this.userService.getUsersWhoLikedMe(userId);
  }

  @Put(':userId')
  @UseInterceptors(FilesInterceptor('profilePictures', 6))
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng đã được cập nhật',
  })
  @ApiResponse({ status: 404, description: 'Người dùng không tìm thấy' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    return this.userService.updateUser(userId, updateUserDto, files);
  }

  @Get(':id/matches')
  async getMatchedUsers(@Param('id') id: string) {
    return this.userService.getMatchedUsers(id);
  }

  @Get('matching/:userId')
  @ApiOperation({ summary: 'Lấy danh sách người dùng phù hợp theo giới tính' })
  async getMatchingUsers(@Param('userId') userId: string) {
    return this.userService.findMatchingUsers(userId);
  }
}
