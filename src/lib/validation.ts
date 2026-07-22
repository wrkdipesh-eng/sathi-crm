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

// Verifies an email's domain can actually receive mail by checking for a
// DNS MX record. Deliberately does NOT fall back to an A/AAAA record: while
// RFC 5321 permits delivering to a bare A record when no MX exists, in
// practice a domain with only an A record and no MX is almost always a
// parked/typo-squatted domain (e.g. "gmial.com") serving an ad page, not a
// real mail server — accepting it would defeat the point of this check.
// This confirms the domain is real and mail-capable; it cannot confirm the
// specific mailbox exists without an SMTP handshake, which is out of scope.
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
  const DNS_TIMEOUT_CODE = 'MX_LOOKUP_TIMEOUT';
  const DNS_TIMEOUT_MS = 5000;

  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out'), { code: DNS_TIMEOUT_CODE })), DNS_TIMEOUT_MS)
      ),
    ]);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true };
    }
    return { valid: false, reason: `The domain "${domain}" does not appear to accept email` };
  } catch (err) {
    // Any real answer from the DNS resolver (ENOTFOUND, ENODATA, SERVFAIL,
    // REFUSED, ...) means the domain has no working MX record — reject.
    // Only our own artificial timeout above is genuinely ambiguous (we
    // don't know the real answer), so that's the one case we fail open on
    // rather than blocking a legitimate lead over a slow DNS server.
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === DNS_TIMEOUT_CODE) {
      return { valid: true };
    }
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
