import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard (Role-Based Access Control)
 * Membandingkan role user di JWT dengan daftar role yang diizinkan di decorator @Roles().
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika endpoint tidak diberi decorator @Roles, berarti semua role yang login boleh akses
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Akses ditolak: pengguna tidak terotentikasi');
    }

    // SUPERADMIN memiliki hak akses tertinggi ke seluruh endpoint berizin
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Akses ditolak: role "${user?.role}" tidak memiliki wewenang untuk tindakan ini`,
      );
    }

    return true;
  }
}
