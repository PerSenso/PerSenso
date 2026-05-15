import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Tokens con estructura JWT real (header.payload.signature) para que
// split('.')[2] funcione correctamente en los tests
const MOCK_ACCESS_TOKEN = 'eyJhdr.eyJwYX.access_sig_abc';
const MOCK_REFRESH_TOKEN = 'eyJhdr.eyJwYX.refresh_sig_xyz';
const MOCK_NEW_ACCESS = 'eyJhdr.eyJwYX.new_access_sig';
const MOCK_NEW_REFRESH = 'eyJhdr.eyJwYX.new_refresh_sig';

const mockUser = {
  id: 'user-uuid-1',
  username: 'admin',
  password: 'hashed-password',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  refreshToken: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      mockJwt.sign
        .mockReturnValueOnce(MOCK_ACCESS_TOKEN)
        .mockReturnValueOnce(MOCK_REFRESH_TOKEN);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed-sig');
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      const result = await service.login('admin', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.refreshToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: mockUser.id } }),
      );
    });

    it('should store hash of token SIGNATURE (not full token) to avoid bcrypt 72-byte truncation', async () => {
      mockJwt.sign
        .mockReturnValueOnce(MOCK_ACCESS_TOKEN)
        .mockReturnValueOnce(MOCK_REFRESH_TOKEN);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashed-sig');
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      await service.login('admin', 'password123');

      // Debe hashear solo la firma (último segmento), no el token completo
      const expectedSig = MOCK_REFRESH_TOKEN.split('.')[2];
      expect(hashSpy).toHaveBeenCalledWith(expectedSig, expect.any(Number));
    });

    it('should include unique jti in every generated token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      mockPrisma.refreshToken.upsert.mockResolvedValue({});

      // Restablecer sign para capturar todos los payloads
      mockJwt.sign.mockReturnValue('eyJhdr.eyJwYX.sig');
      await service.login('admin', 'password123');
      await service.login('admin', 'password123');

      const jtis = mockJwt.sign.mock.calls
        .map(([payload]: [Record<string, unknown>]) => payload?.jti)
        .filter(Boolean);

      // Cada llamada a sign incluye jti, y todos son únicos
      expect(jtis.length).toBeGreaterThanOrEqual(4);
      expect(new Set(jtis).size).toBe(jtis.length);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(service.login('admin', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh token', async () => {
      mockJwt.sign
        .mockReturnValueOnce(MOCK_NEW_ACCESS)
        .mockReturnValueOnce(MOCK_NEW_REFRESH);
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        userId: mockUser.id,
        token: 'hashed-old-sig',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await service.refresh(MOCK_REFRESH_TOKEN);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should compare incoming token SIGNATURE against stored hash', async () => {
      const incomingToken = 'header.payload.incoming_sig';
      mockJwt.sign
        .mockReturnValueOnce(MOCK_NEW_ACCESS)
        .mockReturnValueOnce(MOCK_NEW_REFRESH);
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        userId: mockUser.id,
        token: 'hashed-incoming-sig',
      });
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.refresh(incomingToken);

      // Debe comparar solo la firma ('incoming_sig'), no el token completo
      expect(compareSpy).toHaveBeenCalledWith(
        'incoming_sig',
        'hashed-incoming-sig',
      );
    });

    it('should store hash of NEW token SIGNATURE after rotation', async () => {
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockJwt.sign
        .mockReturnValueOnce(MOCK_NEW_ACCESS)
        .mockReturnValueOnce(MOCK_NEW_REFRESH);
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        userId: mockUser.id,
        token: 'hashed-old-sig',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'new-hash');
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.refresh(MOCK_REFRESH_TOKEN);

      // Debe hashear la firma del NUEVO token, no el token completo
      const newSig = MOCK_NEW_REFRESH.split('.')[2];
      expect(hashSpy).toHaveBeenCalledWith(newSig, expect.any(Number));
    });

    it('should update stored hash with new token after rotation', async () => {
      mockJwt.sign
        .mockReturnValueOnce(MOCK_NEW_ACCESS)
        .mockReturnValueOnce(MOCK_NEW_REFRESH);
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        userId: mockUser.id,
        token: 'hashed-old-sig',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'new-hash');
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.refresh(MOCK_REFRESH_TOKEN);

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        data: { token: 'new-hash' },
      });
    });

    it('should throw UnauthorizedException if token is invalid jwt', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if stored token not found', async () => {
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(MOCK_REFRESH_TOKEN)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if token signature does not match stored hash', async () => {
      mockJwt.verify.mockReturnValue({ sub: mockUser.id, role: 'ADMIN' });
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        userId: mockUser.id,
        token: 'hash-of-different-sig',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(service.refresh(MOCK_REFRESH_TOKEN)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token from DB', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout(mockUser.id);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });
});
