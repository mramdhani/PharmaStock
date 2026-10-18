import * as Joi from 'joi';

/**
 * Skema validasi environment variable.
 *
 * Dijalankan SEKALI saat aplikasi start. Kalau ada variabel yang hilang
 * atau formatnya salah, aplikasi langsung gagal start dengan pesan jelas,
 * daripada error misterius saat sudah berjalan (prinsip "fail fast").
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  // Minimal 32 karakter supaya JWT tidak mudah ditebak (brute force).
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),

  FRONTEND_URL: Joi.string().uri().required(),
});
