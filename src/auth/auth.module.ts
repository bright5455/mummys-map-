import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { UsersModule } from '../user/user.module';
import { User } from 'src/user/entity/user.entity';

@Module({
 imports: [
  ConfigModule,
  TypeOrmModule.forFeature([User]),
  UsersModule,
  PassportModule.register({ defaultStrategy: 'jwt' }),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('jwt.secret'),
      signOptions: {
        expiresIn: configService.get<number>('jwt.expiresIn'),
      },
    }),
  }),
],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
  ],

  exports: [
    AuthService,
    JwtStrategy,
    PassportModule,
    RolesGuard,
  ],
})
export class AuthModule {}
