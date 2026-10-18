import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO untuk mengupdate Category.
 * Mewarisi semua validasi dari CreateCategoryDto tetapi bersifat opsional.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
