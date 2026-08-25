import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (role?: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { sub: 'user-1', email: 'test@test.com', role } : undefined }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('USER'))).toBe(true);
  });

  it('should allow admin when roles include ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext('ADMIN'))).toBe(true);
  });

  it('should allow moderator when roles include MODERATOR', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MODERATOR, UserRole.ADMIN]);
    expect(guard.canActivate(mockContext('MODERATOR'))).toBe(true);
  });

  it('should deny normal user when ADMIN required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext('USER'))).toThrow(ForbiddenException);
  });

  it('should deny normal user when MODERATOR/ADMIN required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MODERATOR, UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext('USER'))).toThrow(ForbiddenException);
  });

  it('should deny access when no user in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });

  it('should allow organizer when roles include ORGANIZER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ORGANIZER, UserRole.ADMIN]);
    expect(guard.canActivate(mockContext('ORGANIZER'))).toBe(true);
  });

  it('should deny normal user when ORGANIZER/ADMIN required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ORGANIZER, UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext('USER'))).toThrow(ForbiddenException);
  });
});
