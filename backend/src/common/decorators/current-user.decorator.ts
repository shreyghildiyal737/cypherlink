import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: Record<string, unknown> }>();
    if (!request.user) return undefined;
    if (data) return String(request.user[data] ?? '');
    return request.user.sub as string;
  },
);
