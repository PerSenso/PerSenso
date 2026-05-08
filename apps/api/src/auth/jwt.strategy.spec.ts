import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should validate and return user from payload', () => {
    const payload = { sub: 'user-id', role: 'ADMIN' };
    const result = strategy.validate(payload);

    expect(result).toEqual({ id: 'user-id', role: 'ADMIN' });
  });

  it('should map sub to id', () => {
    const payload = { sub: 'another-id', role: 'OWNER' };
    const result = strategy.validate(payload);

    expect(result.id).toBe('another-id');
    expect(result.role).toBe('OWNER');
  });
});
