import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { detectProfanity, sanitizeDeep } from '../utils/security-sanitizer.util';

/**
 * Global Security & Sanitization Pipe
 * 1. Mencegah XSS (Cross-Site Scripting) dengan membersihkan seluruh tag HTML/JS.
 * 2. Memfilter kata-kata kasar / vulgar (Bahasa Indonesia & Inggris).
 */
@Injectable()
export class SecuritySanitizerPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Hanya proses body request (custom objects)
    if (metadata.type !== 'body' || !value || typeof value !== 'object') {
      return value;
    }

    // 1. Periksa Kata Kasar / Profanity
    this.validateProfanity(value);

    // 2. Bersihkan HTML / XSS Injection secara mendalam
    return sanitizeDeep(value);
  }

  private validateProfanity(obj: any, parentKey = '') {
    if (typeof obj === 'string') {
      const badWord = detectProfanity(obj);
      if (badWord) {
        throw new BadRequestException(
          `Input pada field "${parentKey || 'teks'}" mengandung kata kasar/dilarang ("${badWord}"). Mohon gunakan istilah farmasi yang sopan dan profesional.`,
        );
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) =>
        this.validateProfanity(item, `${parentKey}[${index}]`),
      );
      return;
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, val] of Object.entries(obj)) {
        // Jangan cek profanity pada hashed password
        if (key.toLowerCase().includes('password')) continue;

        this.validateProfanity(val, key);
      }
    }
  }
}
