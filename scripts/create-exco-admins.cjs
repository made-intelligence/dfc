/**
 * DFC EXCO + Secretariat admin account provisioner + claim-invite sender.
 *
 * Creates (or safely upgrades) privileged accounts and emails each a claim
 * link so they set their own password. Non-destructive by design:
 *   - new email            -> create passwordless account + claim token
 *   - exists, no password  -> refresh claim token, upgrade role if lower
 *   - exists, has password -> upgrade role / set EXCO position only; DOES NOT
 *                             touch the password or send a claim link, unless
 *                             --force-reset is passed (nulls password so they
 *                             can re-claim). Protects already-active logins.
 *
 * SAFETY: dry-run by default.
 *   node scripts/create-exco-admins.cjs                        # preview only
 *   node scripts/create-exco-admins.cjs --commit               # write, no email
 *   node scripts/create-exco-admins.cjs --commit --send --zepto-env=/path/to/zepto.env
 *   node scripts/create-exco-admins.cjs --commit --send --force-reset --zepto-env=...
 *   node scripts/create-exco-admins.cjs --only=folake@iyewo.com --commit --send --zepto-env=...
 *
 * Env: DATABASE_URL (process env), and ZEPTOMAIL_API_KEY via --zepto-env file.
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const fs = require('fs');

const CLAIM_BASE_URL = (process.env.CLAIM_BASE_URL || 'https://www.dfcare.org').replace(/\/+$/, '');
const CLAIM_TTL_DAYS = 30;
const SEND_DELAY_MS = 1200;
const MAIL_FROM = process.env.MAIL_FROM || 'Doctors Foundation for Care <platform@consultforafrica.com>';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || 'hello@consultforafrica.com';
const ZEPTO_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--commit');
const SEND = args.includes('--send');
const FORCE_RESET = args.includes('--force-reset');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const ZEPTO_ENV = (args.find((a) => a.startsWith('--zepto-env=')) || '').split('=')[1] || '';

if (ZEPTO_ENV) {
  const txt = fs.readFileSync(ZEPTO_ENV, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*(ZEPTOMAIL_API_KEY|MAIL_FROM|MAIL_REPLY_TO)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const ZEPTO_KEY = (process.env.ZEPTOMAIL_API_KEY || '').replace(/^Zoho-enczapikey\s*/i, '').trim();

// Desired roster. excoPosition null => no DFCMember record (staff account).
const ACCOUNTS = [
  { name: 'Dr. Debo Odulana',        email: 'dodulana@gmail.com', role: 'SUPERADMIN',  excoPosition: 'PRESIDENT' },
  { name: 'Dr. Folake Kofo-Idowu',   email: 'folake@iyewo.com',   role: 'SUPERADMIN',  excoPosition: 'VICE_PRESIDENT' },
  { name: 'Prof. Abdul Kareem Lateef', email: 'oakareem@yahoo.com', role: 'SUPERADMIN', excoPosition: 'TREASURER' },
  { name: 'DFC Secretariat',         email: 'secretariat@dfcare.org', role: 'SECRETARIAT', excoPosition: null },
];

const ROLE_RANK = { SUPERADMIN: 6, SECRETARIAT: 5, DFC_MEMBER: 4, HOSPITAL_ADMIN: 3, SPL_ADMIN: 2, PATIENT: 1 };

function generateClaimToken() { return randomBytes(32).toString('base64url'); }
function claimUrl(token) { return `${CLAIM_BASE_URL}/auth/claim?token=${encodeURIComponent(token)}`; }
function claimEmailHtml(name, link, role) {
  const roleLabel = role === 'SECRETARIAT' ? 'Secretariat' : 'Executive Committee';
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px">
    <div style="text-align:center;border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:20px">
      <h1 style="color:#0D1F3C;margin:0;font-size:22px">Doctors Foundation for Care</h1>
    </div>
    <p>Dear ${name},</p>
    <p>An administrator account (${roleLabel} access) has been created for you on the Doctors Foundation for Care platform at dfcare.org. To activate it and set your password, please use the secure link below.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${link}" style="background:#0A6E75;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Activate your account</a>
    </div>
    <p style="font-size:14px;color:#555">If the button does not work, copy and paste this link into your browser:<br>
      <a href="${link}" style="color:#0A6E75;word-break:break-all">${link}</a></p>
    <p style="font-size:14px;color:#555">This link is unique to you and expires in ${CLAIM_TTL_DAYS} days.</p>
    <p style="margin-top:24px">Warm regards,<br>The Doctors Foundation for Care Secretariat</p>
    <div style="margin-top:28px;border-top:1px solid #eee;padding-top:10px;font-size:12px;color:#888;text-align:center">
      &copy; ${new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.</div>
  </div></body></html>`;
}

const prisma = new PrismaClient();

function parseAddr(input) {
  const m = (input || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (input || '').trim() };
}
async function sendViaZepto(to, subject, html) {
  const from = parseAddr(MAIL_FROM);
  const reply = parseAddr(MAIL_REPLY_TO);
  const res = await fetch(ZEPTO_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Zoho-enczapikey ${ZEPTO_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: to.email, name: to.name } }],
      reply_to: [{ address: reply.address, name: reply.name }],
      subject, htmlbody: html,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`ZeptoMail: ${data?.error?.details?.[0]?.message || data?.message || res.status}`);
  return data?.data?.[0]?.message_id || 'sent';
}

async function ensureExcoMember(userId, excoPosition) {
  const existing = await prisma.dFCMember.findUnique({ where: { userId }, select: { id: true } });
  if (existing) {
    await prisma.dFCMember.update({ where: { userId }, data: { excoPosition } });
  } else {
    await prisma.dFCMember.create({
      data: { userId, category: 'MEMBER', status: 'ACTIVE', goodStanding: true, path: 'appointment', effectiveDate: new Date(), excoPosition },
    });
  }
}

async function processAccount(acct) {
  const email = acct.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, password: true, name: true } });
  const token = generateClaimToken();
  const expiresAt = new Date(Date.now() + CLAIM_TTL_DAYS * 24 * 60 * 60 * 1000);
  const needsUpgrade = user && (ROLE_RANK[user.role] || 0) < ROLE_RANK[acct.role];

  // Decide the action label
  let action;
  if (!user) action = 'create';
  else if (!user.password) action = 'refresh';               // passwordless -> can claim
  else action = FORCE_RESET ? 'force-reset' : 'exists-active'; // has password

  const willEmail = action === 'create' || action === 'refresh' || action === 'force-reset';

  if (DRY_RUN) {
    return { ...acct, email, action, currentRole: user?.role || null, needsUpgrade: !!needsUpgrade, willEmail, link: willEmail ? claimUrl(token) : null };
  }

  if (!user) {
    const created = await prisma.user.create({
      data: { email, name: acct.name, role: acct.role, password: null, provider: 'local', claimToken: token, claimTokenExpiresAt: expiresAt },
    });
    if (acct.excoPosition) await ensureExcoMember(created.id, acct.excoPosition);
    return { ...acct, email, action, link: claimUrl(token), willEmail: true };
  }

  // Existing user: always fix role up + exco position (non-destructive)
  const data = {};
  if (needsUpgrade) data.role = acct.role;
  if (action === 'refresh' || action === 'force-reset') {
    data.claimToken = token;
    data.claimTokenExpiresAt = expiresAt;
    if (action === 'force-reset') data.password = null;
  }
  if (Object.keys(data).length) await prisma.user.update({ where: { id: user.id }, data });
  if (acct.excoPosition) await ensureExcoMember(user.id, acct.excoPosition);
  return { ...acct, email, action, currentRole: user.role, upgraded: !!needsUpgrade, link: willEmail ? claimUrl(token) : null, willEmail };
}

(async () => {
  let list = ACCOUNTS;
  if (ONLY) list = list.filter((a) => a.email.toLowerCase() === ONLY.toLowerCase());

  console.log(`\n=== DFC admin/EXCO provisioner ===`);
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'COMMIT'} | email: ${SEND && !DRY_RUN ? 'SEND' : 'no'} | force-reset: ${FORCE_RESET} | accounts: ${list.length}`);
  console.log(`transport: ${ZEPTO_KEY ? 'ZeptoMail API' : 'NONE (no key)'} | from: ${MAIL_FROM}`);
  console.log(`claim base: ${CLAIM_BASE_URL}\n`);
  if (SEND && !DRY_RUN && !ZEPTO_KEY) { console.log('ABORT: --send requested but no ZEPTOMAIL_API_KEY (pass --zepto-env=<file>).'); process.exit(1); }

  await prisma.$connect();
  const results = [];
  for (const acct of list) {
    try {
      const r = await processAccount(acct);
      let emailNote = '';
      if (SEND && !DRY_RUN && r.willEmail && r.link) {
        try { const id = await sendViaZepto({ email: r.email, name: r.name }, 'Activate your Doctors Foundation for Care account', claimEmailHtml(r.name, r.link, r.role)); emailNote = ` | emailed (${id})`; }
        catch (e) { emailNote = ` | EMAIL FAILED: ${e.message}`; }
        await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
      }
      results.push(r);
      const roleNote = r.needsUpgrade || r.upgraded ? ` [role ${r.currentRole}->${r.role}]` : (r.currentRole ? ` [role ${r.currentRole}]` : ` [role ${r.role}]`);
      console.log(`[${r.action}] ${r.name} <${r.email}>${roleNote}${r.willEmail ? '' : ' (no claim email)'}${emailNote}`);
    } catch (e) {
      results.push({ ...acct, action: 'ERROR', error: e.message });
      console.log(`[ERROR] ${acct.name} <${acct.email}>: ${e.message}`);
    }
  }

  const scratch = process.env.CLAIM_AUDIT_DIR || require('os').tmpdir();
  const outPath = `${scratch}/dfc-exco-provision.json`;
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\naudit log: ${outPath}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error('FATAL', e); await prisma.$disconnect(); process.exit(1); });
