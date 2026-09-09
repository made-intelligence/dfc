/**
 * Re-issue activation links to members whose claim link expired.
 *
 * Targets exactly the locked-out set from the database (no password set, has a
 * claim token, token expired) rather than a CSV, so it cannot touch members who
 * have already activated.
 *
 * SAFETY: dry-run by default; emails only with --send.
 *   node scripts/resend-expired-claims.cjs                            # preview
 *   node scripts/resend-expired-claims.cjs --commit                   # refresh tokens, NO email
 *   node scripts/resend-expired-claims.cjs --commit --send --zepto-env=<file>
 *   node scripts/resend-expired-claims.cjs --only=someone@example.com --commit --send --zepto-env=<file>
 *   node scripts/resend-expired-claims.cjs --limit=5 ...              # trickle a first batch
 *
 * Mirrors the sender identity and pacing of import-members.cjs so members see
 * the same email they got originally.
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const fs = require('fs');

const prisma = new PrismaClient();

// ---- config ----------------------------------------------------------------
const CLAIM_BASE_URL = (process.env.CLAIM_BASE_URL || 'https://www.dfcare.org').replace(/\/+$/, '');
const CLAIM_TTL_DAYS = 30;
const SEND_DELAY_MS = 1200;
const ZEPTO_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--commit');
const SEND = args.includes('--send');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const LIMIT = parseInt((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0', 10);
const ZEPTO_ENV = (args.find((a) => a.startsWith('--zepto-env=')) || '').split('=')[1] || '';

// Read the API key from an external file so the secret never sits in argv.
if (ZEPTO_ENV) {
  const txt = fs.readFileSync(ZEPTO_ENV, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*(ZEPTOMAIL_API_KEY|MAIL_FROM|MAIL_REPLY_TO)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const MAIL_FROM = process.env.MAIL_FROM || 'Doctors Foundation for Care <platform@consultforafrica.com>';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || 'hello@consultforafrica.com';
const ZEPTO_KEY = (process.env.ZEPTOMAIL_API_KEY || '').replace(/^Zoho-enczapikey\s*/i, '').trim();

function claimUrl(token) {
  return `${CLAIM_BASE_URL}/auth/claim?token=${encodeURIComponent(token)}`;
}

function parseAddr(input) {
  const m = (input || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (input || '').trim() };
}

function buildHtml(name, link) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 24px;font-size:22px;color:#0D1F3C;text-align:center">Doctors Foundation for Care</h1>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px" />
    <p>Dear ${name},</p>
    <p>Your activation link for the Doctors Foundation for Care (DFC) platform at dfcare.org has expired before it was used. Here is a fresh one, valid for ${CLAIM_TTL_DAYS} days.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${link}" style="background:#0A6E75;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Claim your account</a>
    </div>
    <p style="font-size:14px;color:#555">If the button does not work, copy and paste this link into your browser:<br />
      <a href="${link}" style="color:#0A6E75;word-break:break-all">${link}</a>
    </p>
    <p style="font-size:14px;color:#555">If you did not expect this, you can ignore this email.</p>
  </div></body></html>`;
}

async function sendViaZepto(to, name, subject, html) {
  const from = parseAddr(MAIL_FROM);
  const reply = parseAddr(MAIL_REPLY_TO);
  const res = await fetch(ZEPTO_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${ZEPTO_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: to, name } }],
      reply_to: [{ address: reply.address, name: reply.name }],
      subject,
      htmlbody: html,
    }),
  });
  if (!res.ok) throw new Error(`Zepto ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function main() {
  if (SEND && !ZEPTO_KEY) {
    console.error('--send requires ZEPTOMAIL_API_KEY (pass --zepto-env=<file>). Aborting.');
    process.exit(1);
  }

  const where = {
    password: null,
    claimToken: { not: null },
    claimTokenExpiresAt: { lt: new Date() },
  };
  if (ONLY) where.email = ONLY.toLowerCase().trim();

  let users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, claimTokenExpiresAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (LIMIT > 0) users = users.slice(0, LIMIT);

  console.log(`\n=== expired claim-link resend ===`);
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'COMMIT'} | email: ${SEND ? 'yes' : 'no'} | recipients: ${users.length}`);
  console.log(`from: ${MAIL_FROM} | claim base: ${CLAIM_BASE_URL}\n`);

  const summary = { refreshed: 0, sent: 0, failed: 0 };
  const results = [];

  for (const u of users) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + CLAIM_TTL_DAYS * 24 * 60 * 60 * 1000);
    const link = claimUrl(token);
    const name = u.name || 'DFC Member';

    if (DRY_RUN) {
      console.log(`[would-refresh] ${name} <${u.email}> (expired ${u.claimTokenExpiresAt?.toISOString().slice(0, 10)})`);
      results.push({ email: u.email, name, status: 'would-refresh' });
      summary.refreshed++;
      continue;
    }

    await prisma.user.update({
      where: { id: u.id },
      data: { claimToken: token, claimTokenExpiresAt: expiresAt },
    });
    summary.refreshed++;

    if (!SEND) {
      console.log(`[refreshed] ${name} <${u.email}>`);
      results.push({ email: u.email, name, status: 'refreshed', link });
      continue;
    }

    try {
      await sendViaZepto(u.email, name, 'Your new DFC activation link', buildHtml(name, link));
      console.log(`[sent] ${name} <${u.email}>`);
      results.push({ email: u.email, name, status: 'sent' });
      summary.sent++;
    } catch (e) {
      console.log(`[FAILED] ${name} <${u.email}>: ${e.message}`);
      results.push({ email: u.email, name, status: 'failed', error: e.message });
      summary.failed++;
    }
    await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
  }

  const out = `${require('os').tmpdir()}/dfc-resend-expired-claims.json`;
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log('\n=== summary ===');
  console.log(summary);
  console.log('audit log:', out);
  if (DRY_RUN) console.log('\nNo changes written. Re-run with --commit (and --send to email).');
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
