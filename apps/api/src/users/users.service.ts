import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

const USER_SELECT = {
  id: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('El nombre de usuario ya existe');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { username: dto.username, password: hashed, role: dto.role },
      select: USER_SELECT,
    });
  }

  async setActive(id: string, isActive: boolean, requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (id === requesterId)
      throw new ForbiddenException('No puedes desactivarte a ti mismo');

    if (!isActive && user.role === 'OWNER') {
      const activeOwners = await this.prisma.user.count({
        where: { role: 'OWNER', isActive: true },
      });
      if (activeOwners <= 1)
        throw new BadRequestException('Debe haber al menos un OWNER activo');
    }

    // Al desactivar: invalidar la sesión
    if (!isActive) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: USER_SELECT,
    });
  }
}
