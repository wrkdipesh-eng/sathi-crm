import { isValidPhoneNumber } from 'libphonenumber-js';

const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only these consumer mailbox providers are accepted -- school/work/custom
// domains are rejected outright, even if they have a valid MX record. This
// is a deliberate business rule (not a deliverability check) to keep lead
// contact info restricted to a small set of providers staff can reliably
// reach students on.
const ALLOWED_EMAIL_DOMAINS = new Set([
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

// Accepts only a fixed whitelist of consumer mailbox domains (see
// ALLOWED_EMAIL_DOMAINS) -- everything else is rejected, regardless of
// whether the domain can actually receive mail.
export async function verifyEmailDomain(email: string): Promise<EmailVerificationResult> {
  const trimmed = email.trim();
  if (!isValidEmailFormat(trimmed)) {
    return { valid: false, reason: 'Email address format is invalid' };
  }

  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Email address format is invalid' };
  }

  if (ALLOWED_EMAIL_DOMAINS.has(domain) || domain.endsWith('.edu.np')) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Only Gmail, Yahoo, Outlook, Hotmail, iCloud, Live, or .edu.np college email addresses are accepted`,
  };
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
