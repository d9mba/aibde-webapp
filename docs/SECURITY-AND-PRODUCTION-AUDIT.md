# Security & Production Readiness Audit

Audit date: Feb 9, 2026. Applied fixes follow `docs/code-simplifier.md` (clarity, explicit code, no nested ternaries).

---

## 1. Structure & Middleware

| Issue | Severity | Status |
|-------|----------|--------|
| **Middleware not active** – Next.js only runs `middleware.ts`; logic lived in `proxy.ts` only | Critical | **Fixed**: Added `src/middleware.ts` that re-exports `proxy`. Auth and route protection now run on every request. |

---

## 2. Security

| Issue | Severity | Status |
|-------|----------|--------|
| **LIKE/ilike injection** – User-controlled `query` and `keyword` were interpolated into `ilike`/`or()` without escaping. `%` and `_` act as wildcards; could be abused for data disclosure or heavy queries. | High | **Fixed**: Added `escapeLike()` in `lib/utils.ts`. Used in `lib/data/search.ts`, `app/api/search/route.ts`, and `app/api/tools/route.ts` for all ilike patterns. |
| **Vote API** – No rate limit; no UUID validation for `toolId`. | Medium | **Fixed**: Rate limit via `checkRateLimit(..., rateLimits.sensitive)`. Validate `toolId` with UUID regex before DB use. |
| **Contact API** – No max length on text fields; large payloads possible. | Medium | **Fixed**: Enforced max lengths (e.g. name 100, email 254, query 500, reason 2000). |
| **Submit-tool API** – No rate limit; no max lengths. | Medium | **Fixed**: Rate limit (sensitive). Max lengths for name, email, toolName, url, shortDesc, longDesc, tags, features. |
| **Upload DELETE** – `path` from query could contain `..` or other unsafe chars. | High | **Fixed**: Reject path if it contains `..`, `//`, or `<>"|?*`. |
| **Upload cleanup** – Array of paths deleted without validation; path traversal possible. | High | **Fixed**: `isSafeStoragePath()` rejects `..`, `//`, and invalid chars. Cap at 100 files per request. |
| **Public tools `allData=true`** – Returned unbounded rows (10k+), risking memory/DoS. | Medium | **Fixed**: When `allData=true`, cap with `range(0, 1999)` (max 2000). |

---

## 3. Overflows & Limits

| Issue | Severity | Status |
|-------|----------|--------|
| **Search limit** – `lib/data/search.ts` accepted any `limit`; DB query used `limit * 3` with no cap. | Medium | **Fixed**: Cap `limit` at `MAX_SEARCH_LIMIT` (200). Internal DB fetch capped at `min(limit*3, 1000)`. |
| **API search route** – `limit` from query not capped; `q` not length-limited. | Medium | **Fixed**: Cap `limit` at 100; trim and slice `q` to 200 chars. Escape `q` for ilike. DB fetch capped at 500. |
| **Admin tools list** – Already capped (validLimit max 5000). | – | No change. |

---

## 4. Production Readiness

| Item | Notes |
|------|--------|
| **Env** | Ensure `ADMIN_LOGIN_SECRET`, Clerk, Supabase, R2, Turnstile, Upstash Redis are set in production. |
| **Rate limiting** | Vote, submit-tool, and upload/from-url use `checkRateLimit`. If Redis is down, requests are allowed (fallback); consider failing closed for sensitive routes if needed. |
| **Error handling** | APIs return consistent JSON errors and status codes. Avoid leaking stack traces in production. |
| **CORS / Public APIs** | Proxy blocks direct document navigation and non-browser access to public APIs; admins bypass. |

---

## 5. Files Touched

- `src/middleware.ts` – **New**. Re-exports proxy.
- `src/lib/utils.ts` – Added `escapeLike()`.
- `src/lib/data/search.ts` – Limit cap, `escapeLike` for query/keywords, DB limit cap.
- `src/app/api/search/route.ts` – Limit cap, query length cap, `escapeLike`, DB cap.
- `src/app/api/tools/route.ts` – `escapeLike` for search filter.
- `src/app/api/public/tools/route.ts` – Cap when `allData=true` (2000).
- `src/app/api/upload/route.ts` – DELETE path validation (no `..`, `//`, invalid chars).
- `src/app/api/upload/cleanup/route.ts` – `isSafeStoragePath()`, 100-file cap.
- `src/app/api/vote/route.ts` – Rate limit, UUID validation.
- `src/app/api/contact/route.ts` – Max lengths for all text fields.
- `src/app/api/submit-tool/route.ts` – Rate limit, max lengths, import + `MAX_LEN`.

---

## 6. Recommendations (Optional)

1. **Contact / Submit-tool** – Consider applying rate limit by IP in middleware for extra protection.
2. **Vote** – If votes should be per-user, add auth or fingerprint and enforce one vote per user per tool.
3. **Logging** – Add structured logging for 4xx/5xx and security events (invalid login secret, rate limit hits).
4. **CLAUDE.md** – Referenced by `code-simplifier.md` but missing; add project standards (imports, naming, error handling) for consistency.
