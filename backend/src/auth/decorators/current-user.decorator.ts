import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Custom Param Decorator untuk mengambil objek User yang sedang login dari request.
 * Contoh pemakaian di Controller:
 * @Get('me')
 * getMe(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
