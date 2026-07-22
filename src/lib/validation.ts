import { isValidPhoneNumber } from 'libphonenumber-js';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Domains that are always well-known deliverable mail providers; skip the
// (slower, network-dependent) MX lookup for these to keep the UI snappy.
const KNOWN_MAILBOX_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
]);

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT_REGEX.test(email.trim());
}

export interface EmailVerificationResult {
  valid: boolean;
  reason?: string;
}

// Verifies an email's domain can actually receive mail by checking DNS MX
// records (falling back to an A/AAAA record, per RFC 5321). This confirms
// the domain is real and mail-capable; it cannot confirm the specific
// mailbox exists without an SMTP handshake, which is out of scope here.
export async function verifyEmailDomain(email: string): Promise<EmailVerificationResult> {
  const trimmed = email.trim();
  if (!isValidEmailFormat(trimmed)) {
    return { valid: false, reason: 'Email address format is invalid' };
  }

  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Email address format is invalid' };
  }

  if (KNOWN_MAILBOX_DOMAINS.has(domain)) {
    return { valid: true };
  }

  const dns = await import('node:dns/promises');

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true };
    }
  } catch {
    // No MX records; fall through to A/AAAA fallback below.
  }

  try {
    await dns.resolve(domain);
    return { valid: true };
  } catch {
    return { valid: false, reason: `The domain "${domain}" does not appear to accept email` };
  }
}

export function isValidPhone(phone: string, defaultCountry: 'NP' = 'NP'): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  try {
    return isValidPhoneNumber(trimmed, defaultCountry);
  } catch {
    return false;
  }
}
