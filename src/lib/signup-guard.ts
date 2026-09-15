/**
 * Abuse controls for public self-registration.
 *
 * Public signup was being driven by bots: ~45 of 53 accounts created in two
 * weeks had random-string names, dotted Gmail variants of one inbox, or SMS
 * gateway addresses. Each signup also sent a Welcome email from
 * noreply@dfcare.org to an address the attacker chose, which turns the form
 * into a relay and puts the sending domain's reputation at risk.
 *
 * Per-IP rate limiting alone does not stop this; the traffic is distributed.
 */

/**
 * Carrier SMS/MMS gateways. Mail sent here becomes a text message, which is
 * why they show up in relay abuse. No legitimate DFC member registers with one.
 */
const SMS_GATEWAY_DOMAINS = new Set([
  "vtext.com",
  "txt.att.net",
  "mms.att.net",
  "tmomail.net",
  "messaging.sprintpcs.com",
  "pm.sprint.com",
  "vzwpix.com",
  "msg.fi.google.com",
  "email.uscc.net",
  "mymetropcs.com",
  "sms.cricketwireless.net",
]);

/** Throwaway inbox providers. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
]);

function domainOf(email: string): string {
  return email.toLowerCase().trim().split("@")[1] ?? "";
}

export function isBlockedEmailDomain(email: string): boolean {
  const domain = domainOf(email);
  if (!domain) return false;
  return SMS_GATEWAY_DOMAINS.has(domain) || DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Canonical form of an address for duplicate detection.
 *
 * Gmail ignores dots and anything after "+", so one inbox yields unlimited
 * distinct-looking addresses - the pattern behind most of the bot accounts.
 * Store the address as given, but compare on this.
 */
export function normalizeEmailForDedupe(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return lower;

  const isGoogle = domain === "gmail.com" || domain === "googlemail.com";
  const withoutTag = local.split("+")[0];
  const canonicalLocal = isGoogle ? withoutTag.replace(/\./g, "") : withoutTag;
  const canonicalDomain = domain === "googlemail.com" ? "gmail.com" : domain;

  return `${canonicalLocal}@${canonicalDomain}`;
}

/**
 * Detects machine-generated names such as "wBDtYpjwyrbWcJEPGzHOXDr".
 *
 * Deliberately narrow: it fires only on a single run of letters with repeated
 * mid-word case flips. Any name containing a space is exempt, so ordinary
 * names - including single-word and hyphenated ones like "Ezihe-Ejiofor" or
 * capitalised forms like "McDonald" - are never caught.
 */
export function looksMachineGenerated(name: string): boolean {
  const trimmed = name.trim();
  if (/\s/.test(trimmed)) return false;
  if (trimmed.length < 12) return false;
  if (!/^[A-Za-z]+$/.test(trimmed)) return false;

  let flips = 0;
  for (let i = 1; i < trimmed.length; i++) {
    const prevUpper = trimmed[i - 1] === trimmed[i - 1].toUpperCase();
    const currUpper = trimmed[i] === trimmed[i].toUpperCase();
    if (prevUpper !== currUpper) flips++;
  }
  return flips >= 5;
}

export type SignupRejection = { reason: string; message: string } | null;

/**
 * Screens a registration attempt. `honeypot` is a form field hidden from
 * humans: anything that fills it in is scripted.
 */
export function screenSignup(input: {
  email: string;
  name: string;
  honeypot?: string;
}): SignupRejection {
  if (input.honeypot && input.honeypot.trim() !== "") {
    return { reason: "honeypot", message: "Registration could not be completed." };
  }
  if (isBlockedEmailDomain(input.email)) {
    return {
      reason: "blocked-domain",
      message: "Please register with a permanent personal or work email address.",
    };
  }
  if (looksMachineGenerated(input.name)) {
    return {
      reason: "generated-name",
      message: "Please enter your full name as it appears on your credentials.",
    };
  }
  return null;
}
