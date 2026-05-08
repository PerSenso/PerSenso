import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const tokens = await this.generateTokens(user.id, user.role);

    const hash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { token: hash },
      create: { userId: user.id, token: hash },
    });

    return tokens;
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; role: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { userId: payload.sub },
    });
    if (!stored) throw new ForbiddenException('Sesión inválida');

    const tokenMatches = await bcrypt.compare(refreshToken, stored.token);
    if (!tokenMatches) throw new ForbiddenException('Sesión inválida');

    const tokens = await this.generateTokens(payload.sub, payload.role);

    const hash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.refreshToken.update({
      where: { userId: payload.sub },
      data: { token: hash },
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
