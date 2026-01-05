import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, AuthProvider, UserRole } from '../user/entity/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password } = registerDto;

    const existingUser = await this.usersService.findByEmailOrPhone(
      email,
      phone,
    );

    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    const hashedPassword = await this.hashPassword(password);
    const verificationCode = this.generateVerificationCode();

    const user = await this.usersService.create({
      email,
      phone,
      password: hashedPassword,
      emailVerificationToken: verificationCode,
    });

    const tokens = await this.generateTokens(user);

    this.logger.log(`New user registered: ${email}`);

    return {
      message: 'Registration successful. Please verify your email.',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    if (
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR].includes(
        user.role,
      ) &&
      !user.emailVerified
    ) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${email} from IP: ${ipAddress}`);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }


  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.usersService.update(user.id, {
      emailVerified: true,
      emailVerificationToken: undefined,
    });

    this.logger.log(`Email verified for user: ${user.email}`);

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerificationCode(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationCode = this.generateVerificationCode();

    await this.usersService.update(user.id, {
      emailVerificationToken: verificationCode,
    });

    return {
      message: 'Verification code sent successfully',
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message:
          'If an account exists with this email, you will receive a password reset link',
      };
    }

    const resetToken = this.generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); 

    await this.usersService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    this.logger.log(`Password reset requested for: ${email}`);

    return {
      message:
        'If an account exists with this email, you will receive a password reset link',
    };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetDto.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await this.hashPassword(resetDto.newPassword);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    this.logger.log(`Password reset successful for user: ${user.email}`);

    return {
      message: 'Password reset successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(
      changePasswordDto.newPassword,
    );
    await this.usersService.update(userId, {
      password: hashedPassword,
      refreshToken: undefined,
    });

    this.logger.log(`Password changed for user: ${user.email}`);

    return {
      message: 'Password changed successfully. Please login again.',
    };
  }

  async registerFirstAdmin(registerDto: RegisterUserDto) {
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      throw new ForbiddenException('Super admin already exists');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const superAdmin = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: UserRole.SUPER_ADMIN,
      authProvider: AuthProvider.LOCAL,
      emailVerified: true,
      isActive: true,
    });

    this.logger.log(`First super admin created: ${superAdmin.email}`);

    return {
      message: 'First super admin created successfully',
      user: this.sanitizeUser(superAdmin),
    };
  }

  async registerAdmin(registerDto: RegisterUserDto, superAdminId: string) {
    const superAdmin = await this.usersService.findById(superAdminId);

    if (!superAdmin) {
      throw new NotFoundException('Inviting super admin not found');
    }

    if (superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can invite new admins');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (registerDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot create another super admin');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);
    const verificationToken = this.generateVerificationCode();

    const adminUser = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      role: registerDto.role,
      authProvider: AuthProvider.LOCAL,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      invitedBy: superAdminId,
      isActive: true,
    });

    this.logger.log(
      `Admin user created: ${adminUser.email} by ${superAdmin.email}`,
    );

    return {
      message: 'Admin account created successfully. Verification email sent.',
      user: this.sanitizeUser(adminUser),
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);

    await this.userRepository.update(user.id, {
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: undefined,
    });

    this.logger.log(`User logged out: ${userId}`);

    return {
      message: 'Logout successful',
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('jwt.secret'),
        expiresIn: this.configService.getOrThrow('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateResetToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private sanitizeUser(user: User) {
    const {
      password,
      refreshToken,
      emailVerificationToken,
      resetPasswordToken,
      ...sanitized
    } = user;
    return sanitized;
  }
}