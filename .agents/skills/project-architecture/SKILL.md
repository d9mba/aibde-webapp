---
name: project-architecture
description: High-level system architecture, directory conventions, data access layer (src/lib/data), Supabase SSR/admin clients, R2 storage service, and core BrowseForAI workflows.
---

# BrowseForAI Project Architecture & Data Access Guide

## 1. System Overview
**BrowseForAI** is an AI tool directory application indexing 10,000+ AI tools, categories, and tasks with:
- **Framework**: Next.js 16 (App Router with Turbopack, SSR, ISR, Server Actions)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Clerk (Admin Dashboard access protected with custom secret gate, and public user auth)
- **Media & Object Storage**: Cloudflare R2 accessed through AWS S3 SDK (`@aws-sdk/client-s3`) in `src/services/storage.service.ts`
- **Monetization & Submissions**: Dodo Payments checkout sessions, idempotent webhook handlers, and tool submissions
- **Rate Limiting & Caching**: Upstash Redis sliding window limiter (`@upstash/ratelimit`, `@upstash/redis`)
- **Security & Bot Protection**: Cloudflare Turnstile, HMAC signed cookies, strict CSP headers
- **Analytics & Tracking**: PostHog, GA4, Clarity

---

## 2. Directory Structure & Key Conventions

```
src/
├── app/                            # Next.js App Router (Pages, Layouts, Route Handlers)
│   ├── app/[slug]/                 # Tool detail pages (ISR)
│   ├── category/[slug]/            # Category browse pages
│   ├── task/[slug]/                # Task browse pages
│   ├── search/                     # Live search page & queries
│   ├── submit/                     # Public tool submission flow
│   ├── dashboard/                  # Protected Admin Dashboard
│   ├── api/                        # Protected & public API Route Handlers
│   └── go/[slug]/                  # Affiliate click redirect & impression tracking
├── components/
│   ├── features/                   # Feature-specific components (admin, tools)
│   ├── layout/                     # Header, Footer, TopHeader, Navigation
│   ├── ui/                         # Reusable design system components (SearchSuggestionsDropdown, etc.)
│   └── providers/                  # PostHogProvider, ConditionalClerkProvider
├── context/                        # React Contexts (AdminContext, SearchContext, ThemeContext, etc.)
├── hooks/                          # Custom hooks (useTools, useToolAnalytics, useDebounce, etc.)
├── lib/
│   ├── supabase.ts                 # Legacy/direct Supabase client mappings
│   ├── supabase/                   # Modular client creation
│   │   ├── client.ts               # Browser Supabase client (createBrowserClient)
│   │   └── server.ts               # Server Supabase client & createAdminClient (bypasses RLS with Service Role)
│   ├── data/                       # SERVER DATA LAYER - Centralized DB queries
│   │   ├── counts.ts               # Fast aggregation & tool counts
│   │   ├── categories.ts           # Taxonomy fetching (categories, tasks, tags)
│   │   ├── tools.ts                # Main tool queries (published, spotlight, trending, detail)
│   │   ├── related.ts              # Alternative & suggested tools
│   │   └── search.ts               # Search queries & ranking logic
│   ├── actions.ts                  # Next.js Server Actions for client forms & search
│   ├── rate-limit.ts               # Upstash Redis rate limiting helper
│   ├── turnstile.ts                # Cloudflare Turnstile token validation
│   ├── validations.ts              # Zod validation schemas
│   └── sanitize.ts                 # DOMPurify & string sanitizers
├── services/
│   └── storage.service.ts          # Cloudflare R2 bucket upload/delete/URL generation
└── proxy.ts                        # Request routing, security gates & Clerk proxy handler
```

---

## 3. Data Access Layer Rules (`src/lib/data/`)

When fetching or modifying data from Supabase:
1. **Never execute raw inline Supabase queries inside page components or Route Handlers if a data helper exists**.
2. **Use `src/lib/data/` modules**:
   - `tools.ts`: `getPublishedTools()`, `getToolByAppUsername(slug)`, `getSpotlightTools()`, `getTrendingTools()`, `getToolsByCategory()`, `getToolsByTask()`
   - `categories.ts`: `getCategories()`, `getTasks()`, `getTags()`
   - `counts.ts`: `getToolsCount()`, `getCategoriesCount()`, `getTasksCount()`
   - `search.ts`: `searchTools(params)`, `searchToolsCount(params)`
   - `related.ts`: `getRelatedTools()`, `getSuggestedTools()`
3. **Admin Actions**: Always use `createAdminClient()` or `supabaseAdmin` for privileged operations (e.g. approving submissions, updating status, webhooks) that require bypassing standard client-side RLS.

---

## 4. Media Storage (Cloudflare R2)

Do not use Cloudflare Workers or Wrangler bindings for storage in this codebase. File uploads are performed server-side or via signed handlers through `src/services/storage.service.ts` using `@aws-sdk/client-s3`:
- `uploadFile(file, path, contentType)`
- `deleteFile(path)`
- `getPublicUrl(path)` / `getPathFromUrl(url)`
- `generateUniqueFilename(originalName)`

---

## 5. Affiliate Redirects & Click Tracking (`/go/[slug]`)
The affiliate tracking endpoint `/go/[slug]` routes traffic through clean redirects while logging analytics events in PostHog and capturing click counts before forwarding to the target tool's external URL.
