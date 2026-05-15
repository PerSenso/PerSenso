import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    strategy = new JwtStrategy(null);
  });

  it('should validate and return user from payload', async () => {
    const payload = { sub: 'user-id', role: 'ADMIN', jti: 'some-jti' };
    const result = await strategy.validate(payload);

    expect(result).toEqual({ id: 'user-id', role: 'ADMIN', jti: 'some-jti' });
  });

  it('should map sub to id', async () => {
    const payload = { sub: 'another-id', role: 'OWNER', jti: undefined };
    const result = await strategy.validate(payload);

    expect(result.id).toBe('another-id');
    expect(result.role).toBe('OWNER');
  });
});
