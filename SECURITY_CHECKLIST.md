# DFC Platform — Security & Cybersecurity Checklist

**Platform:** DFC Healthcare (Patient EMR, Prescriptions, Lab Results, Clinical Data)
**Compliance targets:** NDPR (Nigeria Data Protection Regulation), HIPAA (reference), GDPR (for diaspora members)
**Last audited:** 2026-03-12

---

## Current Compliance Estimate

| Standard | Readiness | Notes |
|----------|-----------|-------|
| NDPR     | ~90%      | Right-to-erasure implemented, comprehensive audit logging, consent enforcement, CSRF, data retention policy. Cron automation + DPIA pending |
| HIPAA    | ~88%      | Erasure API, audit trail, consent enforced, CSRF, input validation. Cron automation + penetration test pending |
| GDPR     | ~78%      | Right-to-erasure (Art. 17), PII encryption, consent enforcement, data retention. DPIA + DPA templates pending |

---

## CRITICAL — Fix Before Any Live Patient Data

### 1. CSRF Protection ✅ DONE
- [x] Double-submit cookie pattern implemented (`src/lib/csrf.ts`)
- [x] `generateCsrfToken()` using `crypto.randomBytes(32)`, timing-safe comparison
- [x] `/api/auth/csrf` endpoint issues CSRF token on app load
- [x] Skips CSRF for: webhooks, pharmacy API, public routes, initial auth (login/register/join)
- [x] CSRF validation wired into Next.js middleware (`src/middleware.ts`) — automatic enforcement for all state-changing API requests

### 2. Security Headers ✅ DONE
- [x] Added to `next.config.ts` headers():
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (restrict inline scripts, frame-ancestors 'none')
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 3. XSS in Newsletter Component ✅ DONE
- [x] Sanitize HTML in `src/emails/Newsletter.tsx` using `isomorphic-dompurify`
- [x] Installed `isomorphic-dompurify` with allowlisted tags and attributes
- [ ] Audit `src/components/seo/JsonLd.tsx` for injection via dynamic data

### 4. Encrypt PII at Rest ✅ DONE
- [x] Prisma extension middleware for transparent encrypt/decrypt (`src/lib/pii-encryption.ts`)
- [x] Encrypted fields: `PatientProfile.address`, `PatientProfile.emergencyContact`, `PatientProfile.nhisNumber`, `PatientProfile.nextOfKinPhone`
- [x] Encrypted fields: `User.phone`
- [x] Uses existing AES-256-GCM (`src/lib/encryption.ts`)
- [ ] Consider deterministic encryption for `User.email` to preserve lookup capability

### 5. API Data Minimization ✅ PARTIAL
- [x] `GET /api/doctor/patients` — removed address, phone, emergencyContact, allergies from list view
- [x] `GET /api/auth/login` — reduced profile includes to essential fields only
- [x] `GET /api/admin/users` — added page/limit bounds (max 100)
- [x] Removed MDCN numbers from `/api/public/specialists`
- [x] Removed license number from `/api/public/doctors/[slug]`
- [x] Removed phone from public doctor profile
- [ ] Audit remaining routes for excessive data exposure

### 6. Rate Limiting ✅ DONE
- [x] Auth rate limiting: `/api/auth/login`, `/register`, `/join`, `/legacy-claim` (5 req / 15 min)
- [x] Payment rate limiting: `/api/payment/initialize` (10 req / min)
- [x] Upload rate limiting: `/api/second-opinion/upload`, `/api/upload/image` (10 req / min)
- [x] In-memory rate limiter with auto-cleanup (`src/lib/rate-limit.ts`)
- [ ] Migrate to Redis-backed (`@upstash/ratelimit`) for multi-instance deployment

---

## HIGH — Fix Within 2 Weeks

### 7. JWT Token Expiry ✅ DONE
- [x] Reduced JWT expiry from 7 days to 2 hours in `src/lib/auth.ts`
- [x] Auth cookie Max-Age aligned to 7200s (2h)
- [x] Refresh token system: 7-day httpOnly cookie, token rotation on use (`src/lib/refresh-token.ts`)
- [x] `/api/auth/refresh` endpoint issues new access + refresh tokens
- [x] Token revocation on logout (single device) and revokeAll for password changes
- [x] Refresh cookie scoped to `Path=/api/auth/refresh` only

### 8. Prompt Injection in AI Integration ✅ DONE
- [x] Added `PROMPT_INJECTION_GUARD` to all Claude system prompts (rejects override attempts)
- [x] Added `sanitizeUserInput()` — strips control chars, enforces 10k char limit
- [x] Hardened in `src/lib/ai/service.ts` — all calls go through `callClaude()` with guards
- [ ] Validate AI output before storing/displaying (low risk — output is advisory only)

### 9. Complete Audit Logging ✅ PARTIAL
- [x] AuditLog schema model with userId, action, resource, resourceId, details (JSON), IP, userAgent, severity
- [x] `src/lib/audit.ts` — typed audit service with convenience wrappers (auditAuth, auditAdmin, auditPayment, auditData)
- [x] Login success/failure logging with IP + user agent
- [x] Logout logging
- [x] Payment initialization logging
- [x] Admin settings update logging
- [x] Member status change logging (`admin/users/[id]`)
- [x] Permission change logging (`admin/permissions`)
- [x] Data export logging (`emr/export/[patientId]`)
- [x] Admin doctor creation logging (`admin/doctors`)
- [x] Admin user creation logging (`admin/admins`)
- [x] Credential verification/rejection logging (`admin/credentials/[id]`)
- [x] EXCO position assign/update/remove logging (`admin/exco`)
- [x] Initiative create/update/delete logging (`admin/initiatives`)
- [x] Second opinion case assign logging (`admin/second-opinion/[id]/assign`)
- [x] Second opinion case update logging (`admin/second-opinion/[id]`)
- [ ] Implement log retention (minimum 7 years for healthcare)

### 10. File Upload Security ✅ PARTIAL
- [x] Magic byte validation for PDF, JPEG, PNG, WebP, DOC, DOCX in both upload routes
- [x] Generated safe filenames with `crypto.randomUUID()` (prevents path traversal)
- [x] Rate limiting on upload endpoints (10/min)
- [ ] Scan uploads for malware (ClamAV integration or cloud-based scanner)
- [ ] Validate DICOM files beyond extension check
- [ ] Store uploads in isolated bucket with no execute permissions

### 11. Consent Enforcement ✅ PARTIAL
- [x] Consent library created (`src/lib/consent.ts`) with `hasConsent()`, `hasValidConsent()`, `requireConsent()`
- [x] Consent expiry: 365-day default, configurable per check
- [x] `CONSENT_REQUIREMENTS` map: route patterns → required consent types
- [x] Wired into EMR data export (`emr/export/[patientId]`) — blocks if DATA_PROCESSING consent missing/expired
- [x] Wired into EMR encounters GET/POST — blocks if TREATMENT consent missing/expired
- [x] Wired into EMR prescriptions POST — blocks if TREATMENT consent missing/expired
- [x] Wired into telemedicine room (`room/[id]`) — checks TELEMEDICINE consent for patient
- [ ] Wire into remaining: AI processing
- [ ] Track consent version (if policy changes, re-consent needed)

### 12. Standardize Authentication Pattern ✅ DONE
- [x] Fixed `src/lib/middleware/permissions.ts` — now uses `getTokenFromCookies()` with Bearer fallback
- [ ] Audit all routes for consistent auth pattern
- [ ] Create shared middleware wrapper for protected routes

### NEW — Found in Deep Audit (2026-03-12)

#### Open Redirect in OAuth ✅ FIXED
- [x] Google OAuth callback `state` param validated — only relative paths allowed

#### Insecure Randomness ✅ FIXED
- [x] `Math.random()` replaced with `crypto.randomBytes()` in second opinion reference generation
- [x] Payment reference in subscription route also fixed

#### Credential Exposure in Public APIs ✅ FIXED
- [x] MDCN numbers removed from `/api/public/specialists`
- [x] License numbers removed from `/api/public/doctors/[slug]`
- [x] Phone numbers removed from public doctor profile

#### Location Parameter Injection ✅ FIXED
- [x] Room API location param: HTML stripped, special chars removed, 255 char limit

#### Error Message Leakage ✅ FIXED
- [x] `test-email` route returns generic error, logs details server-side

#### Pagination Bounds ✅ FIXED
- [x] `parsePagination()` utility created (`src/lib/pagination.ts`)
- [x] Applied to: `/api/public/doctors`, `/api/admin/second-opinion`, `/api/ask`, `/api/admin/users`

---

## MEDIUM — Fix Within 1 Month

### 13. Input Validation ✅ PARTIAL
- [x] `validateFields()` utility with `MAX_LENGTHS` constants (`src/lib/validation.ts`)
- [x] Applied to: `doctor/records` (diagnosis, symptoms, treatment, notes), `emr/encounters` (SOAP fields, chiefComplaint, location)
- [x] `parsePagination()` utility (`src/lib/pagination.ts`) — enforces maxLimit=100, min page=1
- [x] Applied pagination to: `/api/public/doctors`, `/api/admin/second-opinion`, `/api/ask`, `/api/admin/users`, `/api/admin/doctors`, `/api/admin/admins`, `/api/admin/appointments`, `/api/admin/secretariat`, `/api/spaces`, `/api/emr/encounters`
- [x] Applied validation to: `ask` POST, `admin/secretariat` POST, `admin/doctors` POST, `admin/admins` POST, `emr/prescriptions` POST, `second-opinion` POST, `admin/second-opinion/[id]` PATCH, `admin/initiatives` POST
- [x] Server-side phone validation utility (`validatePhone()` in `src/lib/validation.ts`) — supports international + Nigerian local formats

### 14. Error Handling
- [ ] Ensure no stack traces are exposed in production API responses
- [ ] Review `src/lib/logger.ts` — ensure production mode doesn't leak sensitive data
- [ ] Return generic error messages to clients, log details server-side only
- [ ] Remove Google OAuth access token from logs (`src/app/api/auth/google/callback/route.ts:92`)

### 15. CORS Configuration ✅ DONE
- [x] Explicitly configured in `next.config.ts` headers for `/api/*` routes
- [x] Production: restricted to `https://dfcare.org` only
- [x] Allowed headers: `Content-Type, Authorization, x-csrf-token, x-api-key`
- [x] Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

### 16. Database Security
- [ ] Use read-only database replicas for public-facing queries
- [ ] Implement connection pooling limits
- [ ] Use separate database users for different service roles (admin vs public)
- [ ] Enable query logging for audit in production
- [ ] Rotate database credentials regularly

### 17. Pharmacy API Key Security
- [ ] Rotate `PHARMACY_API_KEY` regularly
- [ ] Add IP allowlisting for pharmacy API endpoints
- [ ] Log all pharmacy API access with partner identification
- [ ] Implement API key expiry and renewal

---

## LONG-TERM — Within 3 Months

### 18. Right to Erasure / Data Deletion ✅ DONE
- [x] `POST /api/admin/users/[id]/erasure` — SUPERADMIN-only with email confirmation
- [x] Anonymizes User record (name, email, phone, password, profileImage)
- [x] Anonymizes PatientProfile (dateOfBirth, gender, address, emergencyContact, bloodGroup, allergies, nhisNumber)
- [x] Deletes PII-containing records: clinical documents, consent records, access grants/logs, family history, allergies, problems, medications, medical records, ratings
- [x] Anonymizes appointments (strips reason, notes, location) — retains for doctor schedule
- [x] Anonymizes second opinion cases and secretariat tickets
- [x] Deletes notifications and refresh tokens
- [x] Retains anonymized clinical encounters for public health statistics (NDPR Article 2.9)
- [x] CRITICAL audit log entry with erasure details (never deleted)
- [x] Prevents self-erasure and admin-account erasure

### 19. Data Retention Policy ✅ PARTIAL
- [x] Retention constants defined (`src/lib/data-retention.ts`): medical records 10yr, payments 6yr, audit logs 7yr, sessions 30d, notifications 90d
- [x] `cleanupExpiredTokens()` — deletes expired/revoked refresh tokens
- [x] `cleanupOldNotifications()` — deletes read notifications > 90 days
- [x] `runRetentionCleanup()` — orchestrates all cleanup tasks
- [ ] Wire cleanup into cron job or admin endpoint
- [ ] Define retention periods per data type:
  - Medical records: 10 years (Nigerian Medical & Dental Council guidelines)
  - Payment records: 6 years (tax requirements)
  - Audit logs: 7 years
  - WhatsApp logs: 3 years
  - Session data: 30 days
- [ ] Implement automated purging jobs
- [ ] Notify patients before data deletion

### 20. Breach Response
- [ ] Create incident response plan
- [ ] Implement anomaly detection (unusual access patterns, bulk data access)
- [ ] Set up alerts for: failed login spikes, unusual data export volumes, admin privilege escalation
- [ ] NDPR requires breach notification to NITDA within 72 hours
- [ ] Prepare breach notification templates (patients, NITDA, affected parties)

### 21. Secrets Management
- [ ] Migrate from `.env` files to secrets manager (AWS Secrets Manager, Vault)
- [ ] Implement secret rotation for: JWT_SECRET, ENCRYPTION_KEY, database credentials, API keys
- [ ] Audit who has access to production secrets

### 22. Infrastructure Security
- [ ] Enable WAF (Web Application Firewall) on production
- [ ] Implement DDoS protection
- [ ] Set up vulnerability scanning (Snyk, npm audit in CI)
- [ ] Add dependency vulnerability alerting
- [ ] Enable database encryption at rest (Neon supports this)
- [ ] Implement network segmentation (separate database from application tier)

### 23. Penetration Testing
- [ ] Conduct professional penetration test before go-live
- [ ] Schedule quarterly security reviews
- [ ] Add SAST (Static Application Security Testing) to CI pipeline
- [ ] Add DAST (Dynamic Application Security Testing) to staging

---

## Compliance Documentation Needed

| Document | Status | Description |
|----------|--------|-------------|
| Privacy Policy | Exists (`/privacy-policy`) | Review for NDPR compliance |
| Terms of Service | Exists (`/terms`) | Review for healthcare-specific clauses |
| Data Protection Impact Assessment (DPIA) | Missing | Required by NDPR for health data |
| Data Processing Agreement (DPA) | Missing | Required for all third-party processors (Neon, Paystack, Cloudinary) |
| Information Security Policy | Missing | Internal document for team |
| Incident Response Plan | Missing | Required for breach handling |
| Data Retention Policy | Missing | Define per data type |
| Patient Rights Notice | Missing | Right to access, correct, delete, port data |
| NITDA Registration | Missing | Register as data controller with NITDA |
| Consent Records | Partial | Model exists, enforcement library built, wired into EMR export |

---

## Third-Party Data Processors (Need DPAs)

| Service | Data Shared | Risk Level |
|---------|-------------|------------|
| Neon (PostgreSQL) | All patient data | High |
| Paystack | Payment data, patient names | High |
| Cloudinary | Medical documents, images | High |
| Meta (WhatsApp) | Patient phone numbers, names | Medium |
| Anthropic (Claude AI) | Clinical summaries, diagnoses | High |
| Vercel (hosting) | Application traffic | Medium |
| Google (OAuth) | Email addresses | Low |

---

## Quick Wins — All Done ✅

1. ~~Add security headers in `next.config.ts`~~ ✅
2. ~~Remove OAuth token from logs~~ ✅ (verified — no token logging found)
3. ~~Reduce JWT expiry to 2 hours~~ ✅
4. ~~Add `max` validation to search limit params~~ ✅ (admin/users)
5. ~~Sanitize Newsletter HTML with DOMPurify~~ ✅
