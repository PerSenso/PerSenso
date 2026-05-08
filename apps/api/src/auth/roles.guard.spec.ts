import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockContext = (userRole: string) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: userRole } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(mockReflector as unknown as Reflector);
    jest.clearAllMocks();
  });

  it('should allow access when no roles are required', () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('VIEWER'))).toBe(true);
  });

  it('should allow access when user has required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'OWNER']);
    expect(guard.canActivate(mockContext('ADMIN'))).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'OWNER']);
    expect(guard.canActivate(mockContext('VIEWER'))).toBe(false);
  });
});
