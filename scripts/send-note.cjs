/**
 * Send a short personal note to named members.
 *
 * For following up with the specific people who raised an issue, rather than
 * sending them the same broadcast a second time.
 *
 *   node scripts/send-note.cjs
 *   node scripts/send-note.cjs --commit --send --zepto-env=<file>
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--commit');
const SEND = args.includes('--send');
const ZEPTO_ENV = (args.find((a) => a.startsWith('--zepto-env=')) || '').split('=')[1] || '';

if (ZEPTO_ENV) {
  for (const line of fs.readFileSync(ZEPTO_ENV, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(ZEPTOMAIL_API_KEY|MAIL_FROM|MAIL_REPLY_TO)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const MAIL_FROM = process.env.MAIL_FROM || 'Doctors Foundation for Care <platform@consultforafrica.com>';
const MAIL_REPLY_TO = process.env.MAIL_REPLY_TO || 'hello@consultforafrica.com';
const ZEPTO_KEY = (process.env.ZEPTOMAIL_API_KEY || '').replace(/^Zoho-enczapikey\s*/i, '').trim();
const PROFILE_URL = 'https://www.dfcare.org/member/profile';

// The people who raised that specialists could not be found.
const RECIPIENTS = ['ikeorthosurgeon@gmail.com', 'iketubosin@gmail.com'];

function parseAddr(s) {
  const m = (s || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (s || '').trim() };
}

function noteHtml(name) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 24px;font-size:22px;color:#0D1F3C;text-align:center">Doctors Foundation for Care</h1>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px" />
    <p>Dear ${name},</p>
    <p>Thank you for flagging that specialists could not be found on the platform. You were right, and the cause was ours.</p>
    <p>Members were being created without a searchable clinical profile, so most of the register was invisible no matter what anyone searched for. That is now corrected, and all 96 members are listed.</p>
    <p>One thing remains, and only you can do it: your profile does not yet record your specialty. Until it does you can be found by name, but not by what you practise, which is how most colleagues and patients will look for you.</p>
    <p>It takes about two minutes to add your specialty and sub-specialty, your institution and city, and a short bio.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${PROFILE_URL}" style="background:#0A6E75;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Add my specialty</a>
    </div>
    <p style="font-size:14px;color:#555">If the button does not work, copy this into your browser:<br />
      <a href="${PROFILE_URL}" style="color:#0A6E75;word-break:break-all">${PROFILE_URL}</a>
    </p>
    <p style="font-size:14px;color:#555">If anything still does not work as it should, reply to this email and tell us. It helps.</p>
  </div></body></html>`;
}

async function sendViaZepto(to, name, subject, html) {
  const from = parseAddr(MAIL_FROM);
  const reply = parseAddr(MAIL_REPLY_TO);
  const res = await fetch('https://api.zeptomail.com/v1.1/email', {
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
    console.error('--send requires ZEPTOMAIL_API_KEY (pass --zepto-env=<file>).');
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { email: { in: RECIPIENTS } },
    select: { name: true, email: true, doctorProfile: { select: { specialtyId: true } } },
  });

  console.log('\n=== personal note ===');
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN' : 'COMMIT'} | email: ${SEND ? 'SEND' : 'no'}`);
  console.log(`from: ${MAIL_FROM}\n`);

  const results = [];
  for (const u of users) {
    const name = u.name || 'Doctor';
    if (u.doctorProfile?.specialtyId) {
      console.log(`  [skip] ${name} <${u.email}> already has a specialty`);
      continue;
    }
    if (DRY_RUN || !SEND) {
      console.log(`  [would send] ${name} <${u.email}>`);
      continue;
    }
    try {
      await sendViaZepto(u.email, name, 'Your DFC listing, and the one thing still missing', noteHtml(name));
      console.log(`  [sent] ${name} <${u.email}>`);
      results.push({ email: u.email, status: 'sent' });
    } catch (e) {
      console.log(`  [FAILED] ${name} <${u.email}>: ${e.message}`);
      results.push({ email: u.email, status: 'failed', error: e.message });
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  const missing = RECIPIENTS.filter((e) => !users.some((u) => u.email.toLowerCase() === e));
  missing.forEach((e) => console.log(`  [not found in database] ${e}`));

  if (!DRY_RUN && SEND) {
    const audit = `${os.tmpdir()}/dfc-note-${Date.now()}.json`;
    fs.writeFileSync(audit, JSON.stringify(results, null, 2));
    console.log(`\naudit: ${audit}`);
  } else {
    console.log('\nNo mail sent. Re-run with --commit --send.');
  }
}

main()
  .catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); })
  .finally(() => prisma.$disconnect());
