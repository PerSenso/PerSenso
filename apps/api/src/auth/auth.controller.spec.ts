import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

const mockResponse = () => {
  const res: Record<string, jest.Mock> = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should set httpOnly cookies and return success message', async () => {
      mockAuthService.login.mockResolvedValue({
        accessToken: 'acc',
        refreshToken: 'ref',
      });
      const res = mockResponse();

      const result = await controller.login(
        { username: 'admin', password: 'password123' },
        res as any,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'admin',
        'password123',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'acc',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'ref',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        message: 'Login exitoso',
        accessToken: 'acc',
        refreshToken: 'ref',
      });
    });
  });

  describe('refresh', () => {
    it('should set new cookies on valid refresh', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      });
      const req = { cookies: { refresh_token: 'old-ref' } };
      const res = mockResponse();

      const result = await controller.refresh(req as any, res as any);

      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Tokens renovados',
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      });
    });

    it('should return 401 if no refresh_token cookie', async () => {
      const req = { cookies: {} };
      const res = mockResponse();

      await controller.refresh(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear cookies and call logout service', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const req = { user: { id: 'user-id' } };
      const res = mockResponse();

      const result = await controller.logout(req as any, res as any);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-id');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ message: 'Sesión cerrada' });
    });
  });
});
