import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.isVerified) {
      throw new ForbiddenException('Debes verificar tu email antes de acceder');
    }

    return true;
  }
}
