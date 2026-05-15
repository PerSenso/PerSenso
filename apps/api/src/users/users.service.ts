import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return users;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('El nombre de usuario ya existe');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: hashed, role: dto.role },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return user;
  }
}
