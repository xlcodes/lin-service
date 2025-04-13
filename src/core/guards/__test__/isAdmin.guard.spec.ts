import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IsAdminGuard } from '@/core/guards/isAdmin.guard';

describe('IsAdminGuard', () => {
  let guard: IsAdminGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = (user: any = null) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new IsAdminGuard();
    (guard as any).reflector = mockReflector;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access if REQUIRE_IS_ADMIN is not set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = mockExecutionContext();
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw if request.user is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = mockExecutionContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('当前用户暂无管理员权限'),
    );
  });

  it('should throw if user.isAdmin is not "1"', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const user = { uid: 'user-123', isAdmin: '0' };
    const context = mockExecutionContext(user);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('当前用户 user-123 暂无管理员权限'),
    );
  });

  it('should throw with empty uid if not provided', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const user = { isAdmin: '0' }; // no uid
    const context = mockExecutionContext(user);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('当前用户  暂无管理员权限'),
    );
  });

  it('should allow access if user.isAdmin is "1"', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const user = { uid: 'admin-001', isAdmin: '1' };
    const context = mockExecutionContext(user);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
