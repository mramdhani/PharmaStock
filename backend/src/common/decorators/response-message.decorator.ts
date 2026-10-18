import { SetMetadata } from '@nestjs/common';

/**
 * Key metadata untuk menyimpan custom response message.
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Decorator untuk menentukan pesan sukses pada route handler.
 * Contoh pemakaian di Controller:
 * @Get()
 * @ResponseMessage('Data produk berhasil diambil')
 * findAll() { ... }
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
