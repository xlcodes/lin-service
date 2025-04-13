import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoginGuard } from '@/core/guards/login.guard';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Request } from 'express';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let reflector: Reflector;
  let userService: UserService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockUserService = {
    verifyToken: jest.fn(),
  };

  const createMockContext = (request: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  const mockExecutionContext = (headers = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new LoginGuard();
    // 手动注入 mock 实例
    (guard as any).reflector = mockReflector;
    (guard as any).userService = mockUserService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access when REQUIRE_LOGIN is not set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = mockExecutionContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw if no authorization header is present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = mockExecutionContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('当前用户未登录！'),
    );
  });

  it('should throw if token is invalid or userService returns null', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    mockUserService.verifyToken.mockResolvedValue(null);

    const context = mockExecutionContext({
      authorization: 'Bearer invalid.token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('当前用户未登录！'),
    );
  });

  it('should set request.user and allow access for valid token', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const user = { id: 1, uuid: 'abc-123' } as unknown as UserEntity;
    mockUserService.verifyToken.mockResolvedValue(user);

    const request: Partial<Request> = {
      headers: {
        authorization: 'Bearer valid.token',
      },
    };

    const context = createMockContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(user);
    expect(mockUserService.verifyToken).toHaveBeenCalledWith('valid.token');
  });

  it('should handle token without "Bearer " prefix gracefully', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const user = { id: 2, uuid: 'user-uuid' } as unknown as UserEntity;
    mockUserService.verifyToken.mockResolvedValue(user);

    const request: Partial<Request> = {
      headers: {
        authorization: 'valid.token',
      },
    };

    const context = createMockContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(user);
    expect(mockUserService.verifyToken).toHaveBeenCalledWith('valid.token');
  });
});
