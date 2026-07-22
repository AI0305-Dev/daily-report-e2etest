import { randomBytes } from "crypto";

export function generateInitialPassword(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = letters + digits;

  const chars = [
    letters[randomBytes(1)[0] % letters.length],
    digits[randomBytes(1)[0] % digits.length],
    ...Array.from({ length: 6 }, () => all[randomBytes(1)[0] % all.length]),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
