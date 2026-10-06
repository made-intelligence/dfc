/**
 * Ask members whose profile has no specialty to finish it, so they become
 * findable by specialty rather than only by name.
 *
 * Two audiences, two different next actions:
 *   - activated members      -> sign in and complete the profile
 *   - never-activated members -> activate first (fresh claim link), then complete
 *
 * SAFETY: dry-run by default.
 *   node scripts/profile-completion-nudge.cjs
 *   node scripts/profile-completion-nudge.cjs --commit --send --zepto-env=<file>
 *   node scripts/profile-completion-nudge.cjs --only=a@b.com --commit --send --zepto-env=<file>
 *   node scripts/profile-completion-nudge.cjs --group=activated ...
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();

const SITE = (process.env.CLAIM_BASE_URL || 'https://www.dfcare.org').replace(/\/+$/, '');
const PROFILE_URL = `${SITE}/member/profile`;
const CLAIM_TTL_DAYS = 30;
const SEND_DELAY_MS = 1200;
const ZEPTO_ENDPOINT = 'https://api.zeptomail.com/v1.1/email';

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--commit');
const SEND = args.includes('--send');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const GROUP = (args.find((a) => a.startsWith('--group=')) || '').split('=')[1] || 'all';
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

function parseAddr(s) {
  const m = (s || '').match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: (s || '').trim() };
}

function shell(name, bodyHtml, ctaLabel, ctaHref) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 24px;font-size:22px;color:#0D1F3C;text-align:center">Doctors Foundation for Care</h1>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px" />
    <p>Dear ${name},</p>
    ${bodyHtml}
    <div style="text-align:center;margin:32px 0">
      <a href="${ctaHref}" style="background:#0A6E75;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">${ctaLabel}</a>
    </div>
    <p style="font-size:14px;color:#555">If the button does not work, copy this link into your browser:<br />
      <a href="${ctaHref}" style="color:#0A6E75;word-break:break-all">${ctaHref}</a>
    </p>
    <p style="font-size:14px;color:#555">Any difficulty, reply to this email and the secretariat will help.</p>
  </div></body></html>`;
}

const FIELDS = `
  <ul style="font-size:15px;color:#333;line-height:1.7">
    <li>Your specialty and sub-specialty</li>
    <li>Current institution and city of practice</li>
    <li>A short professional bio</li>
    <li>Your MDCN number, if you practise in Nigeria</li>
  </ul>`;

function activatedEmail(name) {
  return shell(
    name,
    `<p>Your DFC member profile is live, but it does not yet show a specialty. Colleagues searching the platform for a specialist can find you by name, but not by what you practise, so referrals are passing you by.</p>
     <p>Signing in and completing these takes about two minutes:</p>${FIELDS}
     <p>Once your specialty is saved you appear in the specialist directory and in search results for your field.</p>`,
    'Complete my profile',
    PROFILE_URL,
  );
}

function unactivatedEmail(name, claimLink) {
  return shell(
    name,
    `<p>Your DFC member account has not been activated yet, so your profile is not visible to colleagues searching the platform.</p>
     <p>Two steps. First set your password using the button below. Then add:</p>${FIELDS}
     <p>Once your specialty is saved you appear in the specialist directory and in search results for your field.</p>`,
    'Activate my account',
    claimLink,
  );
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
    console.error('--send requires ZEPTOMAIL_API_KEY (pass --zepto-env=<file>).');
    process.exit(1);
  }

  const members = await prisma.dFCMember.findMany({
    select: {
      user: {
        select: {
          id: true, name: true, email: true, password: true,
          doctorProfile: { select: { id: true, specialtyId: true } },
        },
      },
    },
  });

  let targets = members
    .map((m) => m.user)
    .filter((u) => u && u.doctorProfile && !u.doctorProfile.specialtyId);

  if (ONLY) targets = targets.filter((u) => u.email.toLowerCase() === ONLY.toLowerCase());

  const activated = targets.filter((u) => u.password);
  const unactivated = targets.filter((u) => !u.password);

  const groups = [];
  if (GROUP === 'all' || GROUP === 'activated') groups.push(['activated', activated]);
  if (GROUP === 'all' || GROUP === 'unactivated') groups.push(['unactivated', unactivated]);

  console.log('\n=== profile completion nudge ===');
  console.log(`mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'COMMIT'} | email: ${SEND ? 'SEND' : 'no'}`);
  console.log(`from: ${MAIL_FROM}`);
  console.log(`members missing a specialty: ${targets.length} (activated ${activated.length}, not activated ${unactivated.length})\n`);

  const results = [];
  for (const [label, list] of groups) {
    console.log(`--- ${label}: ${list.length} ---`);
    for (const u of list) {
      const name = u.name || 'Doctor';
      let link = PROFILE_URL;
      let subject = 'Complete your DFC profile so colleagues can find you';

      if (label === 'unactivated') {
        subject = 'Activate your DFC account and complete your profile';
        const token = randomBytes(32).toString('base64url');
        link = `${SITE}/auth/claim?token=${encodeURIComponent(token)}`;
        if (!DRY_RUN) {
          await prisma.user.update({
            where: { id: u.id },
            data: {
              claimToken: token,
              claimTokenExpiresAt: new Date(Date.now() + CLAIM_TTL_DAYS * 864e5),
            },
          });
        }
      }

      if (DRY_RUN) {
        console.log(`  [would email] ${name} <${u.email}>`);
        results.push({ email: u.email, group: label, status: 'would-send' });
        continue;
      }
      if (!SEND) {
        results.push({ email: u.email, group: label, status: 'token-refreshed-only' });
        continue;
      }

      const html = label === 'activated' ? activatedEmail(name) : unactivatedEmail(name, link);
      try {
        await sendViaZepto(u.email, name, subject, html);
        console.log(`  [sent] ${name} <${u.email}>`);
        results.push({ email: u.email, group: label, status: 'sent' });
      } catch (e) {
        console.log(`  [FAILED] ${name} <${u.email}>: ${e.message}`);
        results.push({ email: u.email, group: label, status: 'failed', error: e.message });
      }
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }
  }

  const audit = `${os.tmpdir()}/dfc-profile-nudge-${Date.now()}.json`;
  fs.writeFileSync(audit, JSON.stringify(results, null, 2));
  console.log(`\nsent: ${results.filter((r) => r.status === 'sent').length} | failed: ${results.filter((r) => r.status === 'failed').length}`);
  console.log(`audit: ${audit}`);
  if (DRY_RUN) console.log('\nNo changes written. Re-run with --commit --send.');
}

main()
  .catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); })
  .finally(() => prisma.$disconnect());
