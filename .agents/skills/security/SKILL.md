---
name: security
description: Security guidelines, rate limiting with Upstash Redis, Turnstile CAPTCHA validation, HMAC signed session cookies, Content Security Policy (CSP), input sanitization, and idempotent payment handling.
---

# BrowseForAI Security & Defenses Guide

## 1. Core Security Architecture

This repository uses multiple defensive layers across network boundaries, edge middleware, and application route handlers:

```
[Request] ──▶ [proxy.ts / Middleware] (HMAC Admin Gate, Direct API Navigation Blocking, Clerk Auth)
                 │
                 ├──▶ [Upstash Redis] (Sliding window rate limit by IP)
                 │
                 ├──▶ [Turnstile Token Check] (Server-side CAPTCHA verification for public forms)
                 │
                 ├──▶ [Zod Schema & DOMPurify] (Input validation & HTML sanitization)
                 │
                 └──▶ [Supabase RLS & Admin Client Isolation] (PostgreSQL data security)
```

---

## 2. Hidden Admin Login & HMAC Cookie Gate (`src/proxy.ts`)

- Access to `/login` requires a valid HMAC-signed `admin_access` cookie or navigation through the secret route `/login/[SECRET]`.
- **Constant-Time Comparison**: Secrets and tokens must always be validated with constant-time byte comparisons (e.g. `crypto.subtle.digest` / `crypto.timingSafeEqual`) to prevent timing attacks.
- **Freshness Verification**: The signed cookie value carries a timestamp validated against `COOKIE_MAX_AGE_MS` (1 hour max age).

---

## 3. Rate Limiting (`src/lib/rate-limit.ts`)

- Built with `@upstash/ratelimit` and `@upstash/redis` using sliding-window limits.
- Preconfigured buckets exist for:
  - `upload`: File uploads (strictest limit)
  - `submit`: Public tool submissions
  - `contact`: Contact message submissions
  - `vote`: Tool upvoting/downvoting
  - `api`: General public read APIs
- **Graceful In-Memory Fallback**: If Upstash Redis is temporarily unreachable, requests degrade gracefully to in-memory tracking rather than throwing unhandled 500 errors.

---

## 4. Bot Protection & Form Validation

1. **Cloudflare Turnstile (`src/lib/turnstile.ts`)**:
   - Public submission and contact endpoints must verify the Turnstile token using `verifyTurnstileToken(token)` before performing any database inserts or storage uploads.
2. **Schema & Input Sanitization (`src/lib/validations.ts`, `src/lib/sanitize.ts`)**:
   - All input bodies must be parsed with Zod schemas.
   - User-supplied HTML content (such as rich-text descriptions) must be sanitized with DOMPurify (`sanitizeHtml`) before being persisted or rendered to prevent XSS.
   - URLs must be checked with `isSafeHttpUrl` to prevent `javascript:` and malicious payload injection.

---

## 5. Webhook Security & Idempotency (`src/app/api/dodo/webhook/route.ts`)

- **HMAC Signature Verification**: Always verify `x-dodo-signature` using `crypto.timingSafeEqual` with `DODO_WEBHOOK_SECRET`.
- **Atomic State Transitions**: Prevent double-processing or race conditions (TOCTOU) by executing conditional database updates:
  ```typescript
  .from('payments')
  .update({ status: statusFromEvent, ... })
  .eq('id', existingPayment.id)
  .eq('status', existingPayment.status) // atomic claim
  ```
- **Integer Arithmetic for Currencies**: Always convert currency amounts using integer units (`parsedAmount / Math.pow(10, decimals)`) to prevent IEEE 754 floating-point inaccuracies.
