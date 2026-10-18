import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorator untuk membatasi akses endpoint berdasarkan role pengguna.
 * Contoh pemakaian:
 * @Roles(UserRole.ADMIN)
 * @Roles(UserRole.ADMIN, UserRole.STAFF)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
