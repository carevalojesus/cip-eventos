import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 1. Definimos una interfaz simple para evitar el 'any'
interface RequestWithUser {
  user: unknown;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
