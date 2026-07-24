// Standard, pragmatic email format check — not RFC-5322-exhaustive, but catches
// the common mistakes (missing @, missing domain, stray spaces) without being
// overly strict about edge-case-valid addresses real people rarely use.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
    return EMAIL_REGEX.test(value.trim());
}
