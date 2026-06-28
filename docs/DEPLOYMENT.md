# DFC Platform — Vercel Deployment Handoff

**Host:** Vercel · **Registrar:** Namecheap · **Domain:** dfcare.org · **DB:** Neon Postgres

Do the steps in order. Do not point DNS at production until the app is deployed and verified on the `*.vercel.app` URL.

---

## 1. Deploy to Vercel

1. Import the Git repo at https://vercel.com/new — Next.js 16 is auto-detected.
2. **Install Command override** (Project → Settings → General): `npm install --legacy-peer-deps`
   (the dependency tree requires it; the default `npm install` will fail).
3. Add all environment variables (next section) **before** the first build.
4. Deploy. You get a `https://<project>.vercel.app` URL.

## 2. Environment variables

Set every variable for the **Production** environment (and Preview if you want PR previews to work).

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (the `-pooler` host). Required on serverless or connections exhaust. |
| `NEXT_PUBLIC_APP_URL` | `https://dfcare.org` — canonical origin. Used for payment callbacks, OAuth redirects, email links, SEO. |
| `JWT_SECRET` | Strong random secret. Auth fails open to the dev default if unset — never leave blank. |
| `ENCRYPTION_KEY` | 32+ chars, for sensitive-field encryption. |
| `PAYSTACK_SECRET_KEY` | Live key for production (`sk_live_...`). |
| `ANTHROPIC_API_KEY` | Claude API (ticket classification). |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` | Image uploads. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth. Add `https://dfcare.org/api/auth/google/callback` to the authorized redirect URIs in Google Cloud Console. |
| `GOOGLE_SITE_VERIFICATION` | Search Console (optional). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email. Note the var is `SMTP_PASS`. |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | WhatsApp Cloud API (optional). |
| `CRON_SECRET` | Authorizes `/api/cron/*` and `/api/admin/cron`. |
| `PHARMACY_API_KEY` | Authorizes `/api/pharmacy/*`. |

## 3. Verify on the .vercel.app URL (go/no-go)

Next.js 16 renamed middleware to `proxy.ts` ([src/proxy.ts](../src/proxy.ts)). It enforces auth, role gating, and CSRF. Confirm it actually runs on Vercel before flipping DNS:

- [ ] Log in; hit a protected route (`/admin`, `/member`) signed out → redirected, not served.
- [ ] Role gate: a non-admin cannot reach `/admin`.
- [ ] `next/image` renders Cloudinary images.
- [ ] Second Opinion payment: complete a Paystack test → redirects back to `/second-opinion/callback` on the vercel.app host (NOT localhost).
- [ ] A PDF report generates.

## 4. Point Namecheap DNS at Vercel

1. Vercel → Project → Settings → **Domains** → add `dfcare.org` and `www.dfcare.org`.
2. Namecheap → Domain List → Manage → **Advanced DNS**:
   - **Delete** the default Namecheap parking `CNAME @` and the URL-redirect record.
   - Add **A record**, host `@`, value `76.76.21.21` (use whatever Vercel shows).
   - Add **CNAME record**, host `www`, value `cname.vercel-dns.com`.
3. SSL auto-provisions once DNS propagates (minutes to ~1 hour).

## 5. Post-DNS

- [ ] Update the WhatsApp webhook URL in the Meta dashboard to `https://dfcare.org/api/webhooks/...`.
- [ ] Confirm Google OAuth redirect URI uses the live domain.
- [ ] Set up Vercel Cron (or external) to call the cron routes with the `CRON_SECRET`.

---

## Known constraints

- **Connection pooling is mandatory** on Vercel serverless — use Neon's pooled string.
- `next-pwa@5.6.0` is effectively unmaintained; watch for service-worker quirks after deploy.
- Long-running work (AI calls, PDF generation) runs as serverless functions — mind Vercel's function timeout limits on the chosen plan.
