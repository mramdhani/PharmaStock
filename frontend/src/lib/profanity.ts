/**
 * Frontend Profanity Utilities
 * Mendeteksi kata kasar secara real-time saat mengetik dan mengubahnya menjadi sensor bintang (misal: "An**g").
 * Mencegah pengiriman data ke server jika terdapat kata kasar/sensor dalam form.
 */

export const BAD_WORDS = [
  'anjing', 'anying', 'asw', 'babi', 'bangsat', 'bajingan', 'bedebah',
  'brengsek', 'kampret', 'kontol', 'memek', 'jembut', 'itil', 'puki',
  'pantek', 'ngentot', 'ngentod', 'pepek', 'tempik', 'titit', 'tetek',
  'toket', 'lonte', 'perek', 'jablay', 'bego', 'goblok', 'tolol',
  'idiot', 'peler', 'pejuh', 'tai', 'tahi', 'sange', 'bokep',
  'fuck', 'fucking', 'fucker', 'shit', 'bitch', 'asshole', 'cunt',
  'dick', 'pussy', 'whore', 'slut', 'bastard', 'nigger', 'nigga',
  'cock', 'motherfucker', 'porn', 'porno', 'blowjob',
];

/**
 * Mengubah kata menjadi sensor bintang (misal: "anjing" -> "An**g", "babi" -> "B**i", "tai" -> "T*i")
 */
export function formatMaskedWord(word: string): string {
  if (!word) return '';
  const firstLetter = word.charAt(0).toUpperCase();
  if (word.length <= 2) return firstLetter + '*';
  if (word.length === 3) return firstLetter + '*' + word.slice(2);
  if (word.length === 4) return firstLetter + '**' + word.slice(3);
  if (word.length === 5) return firstLetter + word.slice(1, 2) + '**' + word.slice(4);
  return firstLetter + word.slice(1, 2) + '*'.repeat(word.length - 3) + word.slice(-1);
}

/**
 * Filter real-time saat mengetik:
 * Otomatis mengganti kata kasar yang diketik menjadi sensor bintang (misal: "An**g").
 */
export function maskInputProfanity(input: string): string {
  if (!input) return input;

  let result = input;
  for (const badWord of BAD_WORDS) {
    // Regex case-insensitive dengan batasan kata (word boundary)
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, (match) => {
        // Pertahankan huruf awal kapital jika aslinya kapital
        return formatMaskedWord(match);
      });
    }
  }

  return result;
}

/**
 * Memeriksa apakah input mengandung kata kasar (baik bentuk asli maupun yang sudah tersensor bintang).
 * Mengembalikan string kata sensor jika terdeteksi, atau null jika bersih.
 */
export function checkProfanity(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  // 1. Cek pola sensor bintang (misal: "An**g", "B**i", "T*i", "Pan**k")
  for (const badWord of BAD_WORDS) {
    if (badWord.length >= 3) {
      const prefix = badWord.slice(0, Math.min(2, badWord.length - 1));
      const suffix = badWord.slice(-1);
      const maskedRegex = new RegExp(
        `\\b${prefix}[*#@_]+[a-z0-9*#@_]*${suffix}\\b|\\b${badWord[0]}[*#@_]+${suffix}\\b`,
        'i',
      );
      if (maskedRegex.test(input)) {
        return formatMaskedWord(badWord);
      }
    }
  }

  // 2. Cek kata kasar asli
  const normalized = input.toLowerCase().replace(/[._\-+@#$%^&*()!~`]/g, ' ');
  const words = normalized.split(/\s+/);

  for (const word of words) {
    if (!word) continue;

    if (BAD_WORDS.includes(word)) {
      return formatMaskedWord(word);
    }

    // Deteksi pengulangan huruf (misal: "aannjjiinngg")
    const deduplicated = word.replace(/(.)\1+/g, '$1');
    if (BAD_WORDS.includes(deduplicated)) {
      return formatMaskedWord(deduplicated);
    }
  }

  return null;
}
