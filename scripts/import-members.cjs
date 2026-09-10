/**
 * DFC founding-member importer + claim-invite sender.
 *
 * Creates passwordless User + DFCMember rows for revalidated members and emails
 * each one a unique account-claim link (/auth/claim?token=...). Idempotent:
 * re-running skips already-activated accounts and refreshes tokens for
 * unclaimed ones.
 *
 * SAFETY: dry-run by default.
 *   node scripts/import-members.cjs                 # preview only, no writes, no email
 *   node scripts/import-members.cjs --commit        # create/refresh accounts, NO email
 *   node scripts/import-members.cjs --commit --send # create/refresh AND send claim emails
 *   node scripts/import-members.cjs --test --commit --send   # only the test alias recipient
 *   node scripts/import-members.cjs --only=foo@bar.com --commit --send
 *
 * Env: DATABASE_URL (loaded by Prisma), SMTP_HOST/PORT/USER/PASS/FROM.
 * Claim links point at CLAIM_BASE_URL (default https://dfcare.org).
 */

const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const { randomBytes } = require('crypto');
const fs = require('fs');

// ---- config ----------------------------------------------------------------
const CLAIM_BASE_URL = (process.env.CLAIM_BASE_URL || 'https://www.dfcare.org').replace(/\/+$/, '');
const CLAIM_TTL_DAYS = 30;
const SEND_DELAY_MS = 1200; // gentle pacing between sends

// Sender identity. Uses Consult For Africa's verified ZeptoMail domain
// (consultforafrica.com) with a DFC display name; reply-to is a monitored CFA inbox.
const MAIL_FROM = process.env.MAIL_FROM || 'Doctors Foundation for Care <platform@consultforafrica.com>';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || 'hello@consultforafrica.com';
const ZEPTO_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--commit');
const SEND = args.includes('--send');
const TEST = args.includes('--test');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const FILE = (args.find((a) => a.startsWith('--file=')) || '').split('=')[1] || '';
const ZEPTO_ENV = (args.find((a) => a.startsWith('--zepto-env=')) || '').split('=')[1] || '';

// Load ZEPTOMAIL_API_KEY (and any overrides) from an external env file WITHOUT
// echoing the secret on the command line. Only reads specific keys.
if (ZEPTO_ENV) {
  const txt = require('fs').readFileSync(ZEPTO_ENV, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*(ZEPTOMAIL_API_KEY|MAIL_FROM|MAIL_REPLY_TO)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const ZEPTO_KEY = (process.env.ZEPTOMAIL_API_KEY || '').replace(/^Zoho-enczapikey\s*/i, '').trim();

// Parse a supplementary list file (CSV or pasted spreadsheet rows). For each
// line we pull the first email-looking token and take the text before it as the
// name (stripping quotes, commas, post-nominals). Lines with no email are
// reported and skipped so nothing is silently dropped.
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
function loadExternal(path) {
  const raw = require('fs').readFileSync(path, 'utf8');
  const out = [];
  const skipped = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(EMAIL_RE);
    if (!m) { skipped.push(t); continue; }
    const email = m[0].toLowerCase();
    let name = t.slice(0, m.index).replace(/[",;\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    // strip a trailing lone comma-credential fragment and title prefixes like "DR "/"PROF "
    name = name.replace(/^(DR|PROF|MR|MRS|MS|DR\.|PROF\.)\s+/i, '').trim();
    // title-case ALL-CAPS names (spreadsheet exports) for clean greetings
    if (name && name === name.toUpperCase()) {
      name = name.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
    }
    if (!name) name = email.split('@')[0];
    out.push({ name, email });
  }
  return { out, skipped };
}

// ---- member data (revalidation responses; names cleaned of post-nominals) --
const MEMBERS = [
  { name: 'Abayomi Ogunderu', email: 'yomisteve@gmail.com' },
  { name: 'Adedamola Omogbehin', email: 'domogbehin@marcelleruth.com', note: 'email was corrected for a stray space - confirm' },
  { name: 'Adedoyin Bodunrin Oluyemisi Dosunmu-Ogunbi', email: 'aogunbi@gmail.com' },
  { name: 'Adetola Adegoke', email: 'adetola.adegoke@hotmail.com' },
  { name: 'Akinoso Olujimi Coker', email: 'olujimicoker@gmail.com' },
  { name: 'Amabetare Biu', email: 'tarebiu@aol.com' },
  { name: 'Andrew F. Alalade', email: 'andrew.alalade@gmail.com' },
  { name: 'Anthony O. Owa', email: 'owatony@gmail.com' },
  { name: 'Ayodeji Otegbeye', email: 'ayodejiotegbeye@gmail.com' },
  { name: 'Biodun Ogungbo', email: 'biodunogungbo1@gmail.com' },
  { name: 'Bola Odufuwa-Bolger', email: 'bola@my-iclinic.co.uk' },
  { name: 'Chidi Molokwu', email: 'cmolokwu@hotmail.com' },
  { name: 'Chiedu Obuaya', email: 'c.obuaya@doctors.org.uk' },
  { name: 'Chinedum Anosike', email: 'canosike@accureadradiology.com' },
  { name: 'Fortune Iwuagwu', email: 'austingracesuk@aol.com' },
  { name: 'Henry Ojigbani', email: 'henry@priscillaspecialist.com' },
  { name: 'John Nwofia', email: 'jchije@prodigy.net' },
  { name: 'Joseph Atumonye', email: 'jatumonye@gmail.com' },
  { name: 'Justin Ngene', email: 'aesopforever@yahoo.com' },
  { name: 'Kenechukwu Chudy-Onwugaje', email: 'kenechudy@gmail.com' },
  { name: 'Michael Omobolaji Akinyemi', email: 'michael.o.akinyemi@gmail.com' },
  { name: 'Modupe Elebute-Odunsi', email: 'modupe.elebute@marcelleruth.com' },
  { name: 'Mosunmola Fapohunda', email: 'mosunfolarin@yahoo.co.uk' },
  { name: 'Obioma Lilian Ezekobe', email: 'lezekobe@doctors.org.uk' },
  { name: 'Oge Ilozue', email: 'ogeilozue@gmail.com' },
  { name: 'Okezie Ofor', email: 'okezieofor@gmail.com' },
  { name: 'Oladapo O. O. Fafemi', email: 'datalise@aol.com' },
  { name: 'Oladipo Orimogunje', email: 'supo30@hotmail.com' },
  { name: 'Ololade Akintoye', email: 'lolatoye@gmail.com', note: 'submitted two addresses; using the first' },
  { name: 'Olufemi Oluwatayo', email: 'olufemioluwatayo@gmail.com' },
  { name: 'Onome Oghifobibi', email: 'komegly@gmail.com' },
  { name: 'Orode Doherty', email: 'orode@ingresshealthpartners.com' },
  { name: 'Richard Olumide Oyefeso', email: 'oluoye16@gmail.com' },
  { name: 'Sade Akiode', email: 'sadeakiode@gmail.com' },
  { name: 'Sesi Dosunmu-Ogunbi', email: 'drsesi@bellsouth.net' },
  { name: 'Silvia Okamgba', email: 'silvia.okamgba@gmail.com' },
  { name: 'Taohid Oshodi', email: 'deleoshodi@gmail.com' },
  { name: 'Tolu Ekong', email: 'tolu.ekong@gmail.com' },
];

// Test recipient: a Gmail +alias that lands in dodulana@gmail.com but does NOT
// collide with the real President account. Delete after verifying.
const TEST_MEMBERS = [
  { name: 'Dr. Debo Odulana (claim test)', email: 'dodulana+dfcclaim@gmail.com' },
];

// ---- helpers ---------------------------------------------------------------
function generateClaimToken() {
  return randomBytes(32).toString('base64url');
}
function claimUrl(token) {
  return `${CLAIM_BASE_URL}/auth/claim?token=${encodeURIComponent(token)}`;
}
function claimEmailHtml(name, link) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f4f4f4">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px">
    <div style="text-align:center;border-bottom:1px solid #eee;padding-bottom:12px;margin-bottom:20px">
      <h1 style="color:#0D1F3C;margin:0;font-size:22px">Doctors Foundation for Care</h1>
    </div>
    <p>Dear ${name},</p>
    <p>An account has been created for you on the Doctors Foundation for Care (DFC) platform at dfcare.org. To activate it, please set your password using the secure link below.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${link}" style="background:#0A6E75;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Claim your account</a>
    </div>
    <p style="font-size:14px;color:#555">If the button does not work, copy and paste this link into your browser:<br>
      <a href="${link}" style="color:#0A6E75;word-break:break-all">${link}</a></p>
    <p style="font-size:14px;color:#555">This link is unique to you and will expire in ${CLAIM_TTL_DAYS} days. If it expires, contact the DFC secretariat and we will send you a new one.</p>
    <p style="margin-top:24px">Warm regards,<br>The Doctors Foundation for Care Secretariat</p>
    <div style="margin-top:28px;border-top:1px solid #eee;padding-top:10px;font-size:12px;color:#888;text-align:center">
      &copy; ${new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.</div>
  </div></body></html>`;
}

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !/connect_timeout=/.test(dbUrl)) dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  // Force SMTPS on 465: this environment blocks outbound 587 (STARTTLS).
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function withRetry(fn, label) {
  let lastErr;
  for (let i = 1; i <= 4; i++) {
    try { return await fn(); } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 4000)); }
  }
  throw new Error(`${label} failed: ${lastErr && lastErr.message}`);
}

async function processMember(m) {
  const email = m.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });

  if (existing && existing.password) {
    return { ...m, email, status: 'skip-active', link: null };
  }

  const token = generateClaimToken();
  const expiresAt = new Date(Date.now() + CLAIM_TTL_DAYS * 24 * 60 * 60 * 1000);

  if (DRY_RUN) {
    return { ...m, email, status: existing ? 'would-refresh' : 'would-create', link: claimUrl(token), dry: true };
  }

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { claimToken: token, claimTokenExpiresAt: expiresAt } });
    const hasMember = await prisma.dFCMember.findUnique({ where: { userId: existing.id }, select: { id: true } });
    if (!hasMember) {
      await prisma.dFCMember.create({ data: { userId: existing.id, category: 'MEMBER', status: 'ACTIVE', goodStanding: true, path: 'revalidation', effectiveDate: new Date() } });
    }
    return { ...m, email, status: 'refreshed', link: claimUrl(token) };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: m.name, role: 'DFC_MEMBER', password: null, provider: 'local', claimToken: token, claimTokenExpiresAt: expiresAt },
    });
    await tx.patientProfile.create({ data: { userId: user.id } });
    await tx.dFCMember.create({ data: { userId: user.id, category: 'MEMBER', status: 'ACTIVE', goodStanding: true, path: 'revalidation', effectiveDate: new Date() } });
  });
  return { ...m, email, status: 'created', link: claimUrl(token) };
}

function parseAddr(input) {
  const m = (input || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (input || '').trim() };
}

async function sendViaZepto(r, subject, html) {
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
      to: [{ email_address: { address: r.email, name: r.name } }],
      reply_to: [{ address: reply.address, name: reply.name }],
      subject,
      htmlbody: html,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error?.details?.[0]?.message || data?.error?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`ZeptoMail: ${err}`);
  }
  return data?.data?.[0]?.message_id || data?.request_id || 'sent';
}

async function sendClaim(r) {
  const subject = 'Activate your Doctors Foundation for Care account';
  const html = claimEmailHtml(r.name, r.link);
  if (ZEPTO_KEY) return sendViaZepto(r, subject, html);
  const info = await getTransporter().sendMail({ from: process.env.SMTP_FROM, to: r.email, subject, html });
  return info.messageId;
}

(async () => {
  let list;
  if (TEST) {
    list = TEST_MEMBERS;
  } else {
    // Merge built-in 38 with an optional external list, dedupe by email.
    let merged = [...MEMBERS];
    if (FILE) {
      const { out, skipped } = loadExternal(FILE);
      console.log(`external file: ${FILE} -> ${out.length} rows parsed, ${skipped.length} lines skipped (no email)`);
      if (skipped.length) skipped.forEach((s) => console.log(`   skipped: ${s}`));
      merged = merged.concat(out);
    }
    const seen = new Map();
    const dupes = [];
    for (const m of merged) {
      const key = m.email.toLowerCase().trim();
      if (seen.has(key)) { dupes.push(key); continue; }
      seen.set(key, { ...m, email: key });
    }
    list = [...seen.values()];
    console.log(`merged total: ${merged.length} -> ${list.length} unique (${dupes.length} duplicate emails removed)`);
  }
  if (ONLY) list = list.filter((m) => m.email.toLowerCase() === ONLY.toLowerCase());
  if (list.length === 0) { console.log('No members match the filter.'); process.exit(0); }

  console.log(`\n=== DFC member import ===`);
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'COMMIT'} | email: ${SEND && !DRY_RUN ? 'SEND' : 'no'} | set: ${TEST ? 'TEST' : 'full'} | recipients: ${list.length}`);
  console.log(`transport: ${ZEPTO_KEY ? 'ZeptoMail API' : 'SMTP'} | from: ${MAIL_FROM} | reply-to: ${MAIL_REPLY_TO}`);
  console.log(`claim base: ${CLAIM_BASE_URL}\n`);
  if (SEND && !DRY_RUN && !ZEPTO_KEY) {
    console.log('WARNING: no ZEPTOMAIL_API_KEY loaded - would fall back to Gmail SMTP. Pass --zepto-env=<path> to use ZeptoMail.\n');
  }

  await withRetry(() => prisma.$connect(), 'db connect');

  const results = [];
  for (const m of list) {
    try {
      const r = await processMember(m);
      let emailNote = '';
      if (SEND && !DRY_RUN && (r.status === 'created' || r.status === 'refreshed')) {
        try { const id = await sendClaim(r); emailNote = ` | emailed (${id})`; r.emailed = true; }
        catch (e) { emailNote = ` | EMAIL FAILED: ${e.message}`; r.emailError = e.message; }
        await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
      }
      results.push(r);
      console.log(`[${r.status}] ${r.name} <${r.email}>${r.note ? ' («' + r.note + '»)' : ''}${emailNote}`);
    } catch (e) {
      results.push({ ...m, status: 'ERROR', error: e.message });
      console.log(`[ERROR] ${m.name} <${m.email}>: ${e.message}`);
    }
  }

  // Write an audit log with claim links to the private scratchpad (never the repo)
  const scratch = process.env.CLAIM_AUDIT_DIR || require('os').tmpdir();
  fs.mkdirSync(scratch, { recursive: true });
  const outPath = `${scratch}/dfc-import-results-${TEST ? 'test' : 'full'}.json`;
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  const tally = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  console.log(`\n=== summary ===`);
  console.log(tally);
  console.log(`audit log: ${outPath}`);
  await prisma.$disconnect();
})().catch(async (e) => { console.error('FATAL', e); await prisma.$disconnect(); process.exit(1); });
