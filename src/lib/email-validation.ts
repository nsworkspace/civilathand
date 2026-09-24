/**
 * Helper to validate email format and domain restriction for sign in and sign up.
 * Allowed domains can be configured via environment variables:
 * - NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS or ALLOWED_EMAIL_DOMAINS (comma separated list, e.g. "gmail.com,civilathan.in,yahoo.com")
 * If set, only emails ending with one of the allowed domains will pass validation.
 * If empty or "*", any valid email address format is allowed.
 */

export function parseAllowedDomains(): string[] {
  const envVal =
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ||
    process.env.ALLOWED_EMAIL_DOMAINS ||
    "";

  if (!envVal || envVal.trim() === "*" || envVal.trim() === "") {
    return [];
  }

  return envVal
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function validateEmailDomain(
  email: string,
  customAllowedDomains?: string[]
): { isValid: boolean; error?: string } {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { isValid: false, error: "Email address is required." };
  }

  const trimmed = email.trim().toLowerCase();

  // Standard email format regex
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = trimmed.match(emailRegex);

  if (!match) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  const domain = match[1];
  const allowed = customAllowedDomains ?? parseAllowedDomains();

  if (allowed.length > 0) {
    const isAllowed = allowed.some(
      (allowedDomain) => domain === allowedDomain || domain.endsWith("." + allowedDomain)
    );

    if (!isAllowed) {
      const domainsText = allowed.map((d) => `@${d}`).join(", ");
      return {
        isValid: false,
        error: `Only emails with allowed domain(s) [${domainsText}] are permitted for sign in and sign up.`,
      };
    }
  }

  return { isValid: true };
}
