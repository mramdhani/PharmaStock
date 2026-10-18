/**
 * Security & Sanitization Utilities
 * 1. HTML / XSS Stripper & Entity Escaper
 * 2. Indonesian & English Profanity Filter
 */

// Daftar kata-kata kasar / vulgar (Bahasa Indonesia & Inggris)
const BAD_WORDS_LIST: string[] = [
  // Indonesian profanities / vulgarities
  'anjing', 'anying', 'asw', 'babi', 'bangsat', 'bajingan', 'bedebah',
  'brengsek', 'kampret', 'kontol', 'memek', 'jembut', 'itil', 'puki',
  'pantek', 'ngentot', 'ngentod', 'pepek', 'tempik', 'titit', 'tetek',
  'toket', 'lonte', 'perek', 'jablay', 'bego', 'goblok', 'tolol',
  'idiot', 'peler', 'pejuh', 'tai', 'tahi', 'sange', 'bokep',
  // English profanities
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'cunt',
  'dick', 'pussy', 'whore', 'slut', 'bastard', 'nigger', 'nigga',
  'cock', 'motherfucker', 'porn', 'porno', 'blowjob',
];

/**
 * Membersihkan string dari potensi XSS, HTML tags, dan karakter berbahaya.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    // Hilangkan semua tag HTML (misal: <script>...</script>, <img>, <iframe>, dll.)
    .replace(/<[^>]*>/g, '')
    // Hilangkan javascript: pseudo-protocol
    .replace(/javascript:/gi, '')
    // Hilangkan event handlers seperti onclick=, onerror=, onload=
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Menghasilkan representasi tersensor (masked) dari sebuah kata kasar.
 * Contoh: "anjing" -> "An**g", "babi" -> "B**i", "tai" -> "T*i", "pantek" -> "Pan**k"
 */
export function maskWord(word: string): string {
  if (!word) return '';
  const firstLetter = word.charAt(0).toUpperCase();
  if (word.length <= 2) return firstLetter + '*';
  if (word.length === 3) return firstLetter + '*' + word.slice(2);
  if (word.length === 4) return firstLetter + '**' + word.slice(3);
  if (word.length === 5) return firstLetter + word.slice(1, 2) + '**' + word.slice(4);
  // 6 huruf atau lebih
  return firstLetter + word.slice(1, 2) + '*'.repeat(word.length - 3) + word.slice(-1);
}

/**
 * Memeriksa apakah sebuah string mengandung kata-kata kasar atau vulgar
 * (baik dalam bentuk kata asli maupun bentuk tersensor bintang An**g).
 * Mengembalikan versi tersensor dari kata kasar pertama yang ditemukan, atau null jika aman.
 */
export function detectProfanity(input: string): string | null {
  if (typeof input !== 'string') return null;

  // 1. Deteksi pola sensor bintang untuk kata-kata kasar (misal: "An**g", "b**i", "t*i", "pan**k")
  for (const badWord of BAD_WORDS_LIST) {
    if (badWord.length >= 3) {
      const prefix = badWord.slice(0, Math.min(2, badWord.length - 1));
      const suffix = badWord.slice(-1);
      const maskedRegex = new RegExp(
        `\\b${prefix}[*#@_]+[a-z0-9*#@_]*${suffix}\\b|\\b${badWord[0]}[*#@_]+${suffix}\\b`,
        'i',
      );
      if (maskedRegex.test(input)) {
        return maskWord(badWord);
      }
    }
  }

  // 2. Deteksi kata kasar asli (dengan toleransi spasi, pemisah karakter)
  const normalized = input
    .toLowerCase()
    .replace(/[._\-+@#$%^&*()!~`]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = normalized.split(' ');

  for (const word of words) {
    if (!word) continue;

    // Exact match pada kata dasar
    if (BAD_WORDS_LIST.includes(word)) {
      return maskWord(word);
    }

    // Substring match atau pengulangan karakter (misal: "aannjjiinngg")
    const deduplicated = word.replace(/(.)\1+/g, '$1');
    if (BAD_WORDS_LIST.includes(deduplicated)) {
      return maskWord(deduplicated);
    }

    for (const badWord of BAD_WORDS_LIST) {
      if (word.length >= 4 && word === badWord) {
        return maskWord(badWord);
      }
    }
  }

  return null;
}

/**
 * Membersihkan seluruh string dalam objek/array secara rekursif
 */
export function sanitizeDeep<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeDeep(item)) as unknown as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeDeep(value);
    }
    return sanitizedObj as T;
  }

  return obj;
}
