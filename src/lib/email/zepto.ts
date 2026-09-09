import 'server-only';

/**
 * ZeptoMail HTTP transport.
 *
 * The SMTP settings in SystemSettings authenticate as noreply@dfcmedical.com
 * against smtp.gmail.com with no matching password, so every send failed. The
 * member claim-invite emails that actually reached people were sent through
 * ZeptoMail by scripts/import-members.cjs, so the app uses the same path when
 * ZEPTOMAIL_API_KEY is present and falls back to SMTP otherwise.
 */

const ZEPTO_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';

export const ZEPTO_FROM =
  process.env.MAIL_FROM ||
  'Doctors Foundation for Care <platform@consultforafrica.com>';
export const ZEPTO_REPLY_TO =
  process.env.MAIL_REPLY_TO || 'hello@consultforafrica.com';

function apiKey(): string {
  return (process.env.ZEPTOMAIL_API_KEY || '')
    .replace(/^Zoho-enczapikey\s*/i, '')
    .trim();
}

export function isZeptoConfigured(): boolean {
  return apiKey().length > 0;
}

/** Split "Name <addr@example.com>" into its parts. */
export function parseAddress(input: string): { address: string; name?: string } {
  const m = (input || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (input || '').trim() };
}

export async function sendViaZepto({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const from = parseAddress(ZEPTO_FROM);
  const reply = parseAddress(ZEPTO_REPLY_TO);

  const res = await fetch(ZEPTO_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${apiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: to } }],
      reply_to: [{ address: reply.address, name: reply.name }],
      subject,
      htmlbody: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ZeptoMail ${res.status}: ${body.slice(0, 300)}`);
  }
}
