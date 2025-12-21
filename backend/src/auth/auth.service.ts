import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../database/entities';

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface AuthResponse {
  user: Omit<User, 'sessions' | 'raceParticipants'>;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string): Promise<AuthResponse> {
    // Find or create user - no signup required
    let user = await this.usersService.findByUsername(username);

    if (!user) {
      user = await this.usersService.create(username);
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
    };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.sub);
  }
}
