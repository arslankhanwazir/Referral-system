import argon2 from "argon2";
import { randomBytes } from "crypto";

// Argon2id is the OWASP-recommended default: resistant to both GPU cracking
// (unlike bcrypt) and side-channel timing attacks (unlike argon2i alone).
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB, OWASP minimum recommendation
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Malformed hash or verification error -> treat as invalid, never throw
    // to the caller (avoids leaking hash-format details in error responses).
    return false;
  }
}

// Excludes visually ambiguous characters (0/O, 1/I/L) so referral codes are
// easy to read aloud or retype correctly.
const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += REFERRAL_ALPHABET[bytes[i] % REFERRAL_ALPHABET.length];
  }
  return code;
}

// Opaque, high-entropy session token. Only its SHA-256 hash is ever
// persisted (see auth.ts), so a database read alone can't yield a live
// session cookie.
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
