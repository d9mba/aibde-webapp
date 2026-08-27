# Global Agent Guidelines — BrowseForAI

Repository: `d9mba/aibde-webapp`

These instructions apply to all AI-assisted development, debugging, refactoring, testing, documentation, and maintenance work in this repository.

The goal is to make changes that are correct, secure, maintainable, performant, accessible, well-tested, and consistent with the existing architecture.

---

## 1. Project Context

BrowseForAI is an AI-tool discovery and directory platform.

The application includes:

- AI tool discovery
- Search
- Categories
- Tool pages
- Tool submissions
- User accounts
- Authentication
- Custom authentication UI
- Articles and news
- SEO
- Analytics
- Payments
- Webhooks
- Media uploads
- Administrative workflows
- APIs
- Responsive web experiences

The repository is the source of truth.

Do not assume a technology or feature exists simply because it is related to an AI directory. Inspect the actual implementation before making architectural decisions.

---

## 2. Core Technology Stack

The current application uses:

- Next.js 16
- App Router
- React 19
- TypeScript 5
- Tailwind CSS
- Supabase / PostgreSQL
- Clerk
- Cloudflare R2
- AWS S3-compatible SDK for R2
- Upstash Redis
- Dodo Payments
- PostHog
- Zod
- Playwright
- Sharp

Always verify the actual installed versions and existing implementation before introducing version-specific patterns.

Do not introduce competing technologies without a clear technical reason.

---

## 3. Understand Before Changing

Before modifying existing functionality:

1. Inspect the relevant implementation.
2. Search for existing components, utilities, services, hooks, types, schemas, and data modules.
3. Read relevant documentation.
4. Understand the existing data flow.
5. Understand server/client boundaries.
6. Understand authentication and authorization requirements.
7. Identify relevant tests.
8. Determine whether documentation needs updating.

Do not immediately start coding based only on the task description.

For significant tasks, create a concise implementation plan before making changes.

For trivial tasks, avoid unnecessary planning overhead.

---

## 4. Architecture and Code Organization

Follow the existing repository architecture.

Prefer existing:

- abstractions
- services
- data modules
- hooks
- components
- schemas
- utilities
- error-handling patterns

Do not duplicate functionality that already exists.

Do not introduce a new architectural pattern when an existing project pattern is appropriate.

Avoid unrelated refactoring while implementing a feature.

If an existing abstraction must be changed, understand its consumers before modifying it.

---

## 5. Database and Data Access

Centralized data-access modules under:

`src/lib/data/`

are the preferred way to access application data.

Existing modules include:

- `tools.ts`
- `categories.ts`
- `counts.ts`
- `search.ts`
- `related.ts`

Do not write raw database queries directly inside React components.

Prefer the existing data layer and established query patterns.

Avoid:

- N+1 queries
- unnecessary repeated queries
- fetching unused data
- exposing privileged database operations to clients

---

## 6. Supabase

Supabase/PostgreSQL is the application's database platform.

### Public/User Context

Use:

`createClient()` from `src/lib/supabase/server.ts`

for normal server-side user/public operations.

### Privileged Context

Use:

`createAdminClient()` or the existing `supabaseAdmin` abstraction only when a privileged server-side operation intentionally requires bypassing Row Level Security.

Admin clients must remain server-side.

Never expose service-role credentials to the browser.

Do not bypass RLS for convenience.

Every privileged operation must have an explicit authorization reason.

---

## 7. Next.js

Follow the Next.js App Router architecture.

### Server Components

Prefer Server Components by default.

Use Client Components only when client-side behavior actually requires them, such as:

- browser APIs
- event handlers
- client-side state
- subscriptions
- interactive UI

Do not add `"use client"` unnecessarily.

### Server-Only Code

Keep the following server-side:

- secrets
- privileged database operations
- payment operations
- webhook processing
- storage credentials
- sensitive authentication operations
- private API calls

Never import server-only functionality into client components.

### Routing

Follow existing patterns for:

- routes
- layouts
- loading states
- error states
- metadata
- caching
- revalidation

Do not introduce competing routing conventions.

---

## 8. React and TypeScript

Maintain strong TypeScript safety.

Prefer existing project types.

Avoid `any` unless there is a specific and unavoidable reason.

Do not duplicate types that already exist.

Keep components:

- focused
- readable
- composable
- accessible

Avoid unnecessarily large components.

Follow existing naming and file organization conventions.

---

## 9. Frontend UI and UX

UI quality is a major priority for BrowseForAI.

Use the existing design system.

Use Tailwind CSS variables from:

`src/styles/globals.css`

including existing semantic variables such as:

- `--bg-primary`
- `--bg-card`
- `--accent-primary`

Do not introduce arbitrary design tokens when existing ones apply.

New UI should be:

- responsive
- accessible
- keyboard usable
- mobile friendly
- performant
- visually consistent
- compatible with the existing light/dark theme

Use semantic HTML.

Use ARIA only where appropriate.

Before creating a new component:

1. Search for an existing equivalent.
2. Determine whether an existing component can be extended.
3. Follow established project conventions.

Avoid duplicate buttons, cards, forms, modals, navigation components, and similar UI primitives.

---

## 10. Forms

Forms must provide appropriate:

- labels
- validation
- error messages
- loading states
- disabled states
- success states
- accessibility
- mobile behavior

Always validate important data server-side.

Client-side validation is not a security boundary.

---

## 11. Authentication

Clerk is the authentication system.

Do not introduce another authentication system.

Authentication and authorization are separate concerns.

### Authentication

Use Clerk for:

- sign-in
- sign-up
- sessions
- user identity
- account management

### Authorization

Authorization must be enforced server-side.

Never rely solely on:

- hidden UI
- disabled buttons
- client-side checks
- frontend route protection

for privileged operations.

Perform authorization checks at the server boundary.

---

## 12. Custom Authentication UI

BrowseForAI may use custom-designed login and signup pages.

Custom authentication UI is allowed and encouraged when it improves the product experience.

However:

> Custom UI does not mean custom authentication security.

Use Clerk for the underlying:

- authentication
- sessions
- security
- identity
- token handling

Custom authentication pages should:

- integrate correctly with Clerk
- preserve Clerk security behavior
- support loading states
- handle authentication errors
- be responsive
- be accessible
- follow the BrowseForAI design system

Do not manually implement password storage, session management, token signing, or equivalent authentication infrastructure when Clerk provides it.

---

## 13. Authentication Testing

Authentication changes should consider:

- sign-in
- sign-up
- sign-out
- protected routes
- unauthenticated access
- authenticated access
- authorization boundaries
- admin access
- invalid credentials
- authentication failures
- session handling
- custom login UI
- custom signup UI

Do not test only the happy path.

---

## 14. API Development

API endpoints must follow existing Next.js Route Handler patterns.

APIs should provide:

- request validation
- appropriate HTTP status codes
- predictable response structures
- useful error responses
- authentication where required
- authorization where required
- rate limiting where appropriate
- server-side validation
- secure input handling

Use Zod for request validation where appropriate.

Never trust client-provided input.

Validate:

- request bodies
- query parameters
- route parameters
- relevant headers
- uploaded metadata

---

## 15. API Security

Every API endpoint should be evaluated for:

- authentication
- authorization
- input validation
- rate limiting
- abuse
- sensitive information disclosure
- excessive data exposure
- injection
- replay/duplicate requests where relevant

Public endpoints must be intentionally public.

Do not expose internal database structures unnecessarily.

Do not return secrets or privileged fields.

---

## 16. API Testing

API testing is required for meaningful API changes.

Test relevant:

### Success Cases

- valid requests
- authenticated requests
- authorized requests
- expected response structures

### Failure Cases

- malformed requests
- missing parameters
- invalid parameters
- invalid payloads
- unauthenticated requests
- unauthorized requests
- forbidden operations
- missing resources
- server errors

### Edge Cases

- duplicate requests
- rate limits
- pagination boundaries
- empty results
- unexpected input
- oversized input where relevant

Do not test only HTTP 200 responses.

Use the existing repository testing infrastructure rather than introducing a new framework unnecessarily.

---

## 17. Security and Defense in Depth

Security is a first-class requirement.

### Secrets

Never:

- hardcode secrets
- log secrets
- commit secrets
- expose secrets to client code
- place secrets in documentation
- place secret values inside Agent Skills

Sensitive values include:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_SECRET_KEY`
- `ADMIN_LOGIN_SECRET`
- `DODO_PAYMENTS_API_KEY`
- R2 credentials
- webhook secrets
- private API keys

Environment-variable names may be documented when necessary.

Never document their actual values.

### Timing Attacks

Use constant-time comparison for security-sensitive tokens, HMAC values, and secret validation where applicable.

Prefer mechanisms such as:

- `crypto.timingSafeEqual`
- appropriate Web Crypto APIs

### Input Validation

Validate untrusted input using Zod or established repository schemas.

Never trust:

- request bodies
- query parameters
- route parameters
- headers
- cookies
- uploaded metadata
- user-submitted content

### HTML Sanitization

Sanitize user-submitted HTML using the existing DOMPurify-based implementation such as:

`sanitizeHtml`

before rendering or storing where applicable.

---

## 18. Rate Limiting

Use the existing Upstash Redis rate-limiting infrastructure for public or abuse-prone operations where appropriate.

Pay particular attention to:

- tool submissions
- contact forms
- votes
- uploads
- public mutations
- expensive API operations
- authentication-related abuse

Use the existing:

`src/lib/rate-limit.ts`

patterns.

Do not create a second rate-limiting system unnecessarily.

---

## 19. Cloudflare R2

Object storage uses Cloudflare R2 through the existing S3-compatible implementation.

The primary storage abstraction is:

`src/services/storage.service.ts`

Use the existing storage service.

Do not bypass it unnecessarily.

Do not introduce Wrangler storage bindings when the existing S3-compatible architecture is appropriate.

Keep storage credentials server-side.

Validate uploaded files and metadata appropriately.

---

## 20. Payments

Dodo Payments is the payment platform.

Use the existing Dodo integration.

Do not introduce another payment provider unless explicitly required.

Payment logic involving credentials or privileged operations must remain server-side.

---

## 21. Currency

Never rely on floating-point arithmetic for monetary calculations.

Use integer minor units for:

- prices
- taxes
- discounts
- totals
- payment amounts

Preserve exact arithmetic throughout payment-related flows.

---

## 22. Webhooks

Webhook handlers must be designed for retries and duplicate delivery.

Every webhook should be:

- verified
- validated
- idempotent
- retry-safe
- duplicate-safe

Preserve existing atomic status-transition patterns.

Do not assume webhook delivery occurs exactly once.

Do not mark an event successfully processed before the required operation has actually succeeded.

---

## 23. Articles and News

BrowseForAI will maintain articles, news, and other editorial content.

Content should be:

- factual
- clear
- authoritative
- useful
- readable
- SEO-aware
- appropriately structured

Avoid:

- fabricated claims
- unsupported statistics
- fake quotes
- invented sources
- misleading headlines
- unnecessary clickbait
- repetitive filler

Use a consistent BrowseForAI editorial voice.

---

## 24. News Writing

News content requires additional factual discipline.

Clearly distinguish between:

- confirmed information
- reported information
- analysis
- speculation

When source information is available, preserve appropriate attribution.

Never fabricate:

- quotes
- announcements
- statistics
- company statements
- dates
- product capabilities

Prioritize factual accuracy over sensationalism.

---

## 25. SEO and Content

For public content, consider:

- title metadata
- meta descriptions
- canonical URLs
- Open Graph metadata
- social metadata where applicable
- structured data where appropriate
- semantic headings
- clean URLs/slugs
- internal linking
- image metadata
- indexability

Do not add SEO markup simply for the sake of adding markup.

Metadata must accurately describe the page.

Never use misleading SEO content.

---

## 26. Article Testing

When article/news functionality changes, test relevant behavior such as:

- article rendering
- slugs
- metadata
- links
- publishing state
- structured content
- responsive layouts
- missing content
- invalid content
- SEO metadata

Use the existing testing infrastructure.

---

## 27. Performance

Performance is important for BrowseForAI because the platform contains large tool and search experiences.

Avoid:

- unnecessary client components
- excessive JavaScript
- duplicate requests
- N+1 queries
- oversized payloads
- unnecessary database calls
- unoptimized images
- unnecessary re-renders
- blocking operations
- redundant API calls

Use appropriate:

- server rendering
- caching
- revalidation
- pagination
- image optimization
- lazy loading

Do not assume an optimization is beneficial without validation when practical.

---

## 28. Accessibility

New functionality should follow good accessibility practices.

Consider:

- keyboard navigation
- focus management
- semantic HTML
- labels
- accessible names
- contrast
- reduced-motion preferences
- screen-reader behavior
- form errors
- loading states

Do not rely on color alone to communicate state.

---

## 29. Testing Strategy

Use the existing repository testing infrastructure.

Prefer the appropriate level of testing.

### Unit Tests

Use for isolated utilities and logic.

### Integration/API Tests

Use for:

- API routes
- data operations
- authentication boundaries
- webhooks
- server-side functionality

### End-to-End Tests

Use for important user journeys such as:

- authentication
- search
- tool discovery
- submissions
- checkout
- critical account flows

Do not create tests purely to increase coverage numbers.

Tests should protect meaningful behavior.

---

## 30. Debugging

When fixing a bug:

1. Reproduce the issue when possible.
2. Identify the root cause.
3. Inspect related code.
4. Implement the smallest correct fix.
5. Add or update regression coverage where appropriate.
6. Run relevant validation.
7. Check for side effects.

Do not hide symptoms with arbitrary conditionals.

Do not rewrite large sections of the application to fix a localized issue unless necessary.

---

## 31. Planning Significant Work

For significant features or architectural changes:

1. Understand the requirement.
2. Inspect the existing implementation.
3. Identify affected systems.
4. Identify dependencies.
5. Identify risks.
6. Create an implementation plan.
7. Implement incrementally.
8. Validate each important part.
9. Update documentation.
10. Review the final diff.

Planning should be proportional to task complexity.

Do not create elaborate plans for trivial changes.

---

## 32. Dependencies

Before adding a package:

1. Check whether an existing package already solves the problem.
2. Check whether Next.js, React, or another existing platform dependency provides the functionality.
3. Consider bundle size.
4. Consider maintenance.
5. Consider security.
6. Consider whether the dependency is actively maintained.

Do not add dependencies merely for convenience.

After adding a meaningful dependency, evaluate whether README documentation needs updating.

---

## 33. Scope Discipline

Only modify what is necessary for the requested task.

Do not silently expand scope.

Avoid unrelated:

- refactors
- formatting changes
- dependency upgrades
- architecture changes
- database changes
- UI rewrites
- configuration changes

If an unrelated issue is discovered, mention it separately instead of silently expanding the task.

---

## 34. Git and Change Discipline

Keep changes easy to review.

Prefer:

- focused commits
- logically grouped changes
- meaningful commit messages
- clean diffs

Never commit:

- credentials
- API keys
- private tokens
- local environment secrets
- unnecessary build artifacts

Before completing significant work, review the final diff.

---

## 35. Documentation

Documentation is part of the product.

Before meaningful changes:

1. Read relevant documentation.
2. Determine whether the implementation affects documented behavior.
3. Update affected documentation as part of the same task.

Do not create duplicate documentation when an existing document is the appropriate source of truth.

---

## 36. Mandatory README Maintenance

The root:

`README.md`

is the primary human-readable overview of BrowseForAI.

It must remain synchronized with the actual repository.

### Before Meaningful Development

Read the relevant README sections before implementing meaningful changes.

### After Meaningful Development

Determine whether the README is affected.

README MUST be updated when a change affects:

- features
- capabilities
- architecture
- APIs
- integrations
- authentication
- payments
- storage
- deployment
- setup instructions
- environment variables
- significant user workflows
- major milestones
- important project status
- significant dependencies

README does NOT need to change for:

- trivial bug fixes
- internal refactoring
- formatting-only changes
- variable renaming
- implementation details that do not affect documented behavior

### README Rules

- Update only affected sections.
- Never blindly rewrite the README.
- Preserve useful badges.
- Preserve useful links.
- Preserve useful examples.
- Preserve the existing structure where appropriate.
- Remove obsolete information.
- Do not invent features.
- Do not invent metrics.
- Do not invent roadmap items.
- Do not claim production readiness without evidence.

The README must describe the project as it actually exists.

---

## 37. Project Status

Do not create a separate `project-status` skill or project-status document unless explicitly requested.

The README may contain a concise current-status section.

When significant functionality is:

- completed
- added
- removed
- changed
- deprecated

update the relevant README status information when appropriate.

Do not turn the README into a detailed development diary.

---

## 38. Agent Skills

Specialized skills are located under:

`.agents/skills/`

Use skills selectively.

Do not load every skill for every task.

Use the smallest relevant set of high-quality skills.

Prefer project-specific skills over generic guidance.

Do not create duplicate skills.

Do not install a skill merely because it sounds useful.

A skill should be retained only when it materially helps development or maintenance of this repository.

---

## 39. Skill Priorities

The most important skill areas for BrowseForAI are:

### Tier 1 — Essential

- project architecture
- Next.js
- React/TypeScript
- frontend UI/UX
- backend/API
- Supabase/Postgres
- Clerk authentication
- security
- testing
- API testing
- README/documentation

### Tier 2 — Important

- custom authentication UI
- authentication testing
- articles/news writing
- SEO/content
- webhooks
- Dodo Payments
- performance
- Cloudflare R2
- Upstash/rate limiting
- Vercel deployment
- planning

### Tier 3 — Conditional

- animations/motion
- advanced Vercel-specific patterns
- promotions
- localized pricing
- product catalog management
- generic writing
- framework adapters
- unrelated integrations

Do not retain Tier 3 skills unless the repository actually benefits from them.

---

## 40. AI and LLM Skills

BrowseForAI is an application about AI tools.

That does not automatically mean the project requires:

- OpenAI SDK skills
- Anthropic skills
- generic LLM skills
- prompt-engineering skills
- agent skills
- AI SDK skills

Only use these skills if the actual application code meaningfully integrates or develops these technologies.

Do not confuse an AI-tool directory with an LLM-powered application.

---

## 41. Validation Before Completion

Before considering meaningful development complete:

- implementation is complete
- relevant tests were run
- relevant type checking was run
- relevant linting was run
- build validation was performed when appropriate
- affected user flows were checked when practical
- security implications were considered
- README was reviewed
- README was updated if required
- no secrets were exposed
- no unrelated files were unnecessarily modified
- final diff was reviewed

Never claim a check was performed if it was not actually performed.

---

## 42. Final Response

When completing a development task, provide a concise summary containing:

### Changed

What was implemented.

### Files

Important files changed.

### Validation

Tests and checks actually performed.

### Documentation

State whether README was updated.

If README was not updated, briefly explain why it was not affected.

### Remaining

Known issues, limitations, or follow-up work.

Do not claim functionality that was not implemented.

Do not claim tests passed if they were not run.

---

## 43. Non-Negotiable Principles

1. Inspect before changing.
2. Understand existing architecture before introducing new patterns.
3. Reuse existing components, utilities, services, and data modules.
4. Keep server-only code server-side.
5. Never expose secrets.
6. Validate all untrusted input.
7. Enforce authorization server-side.
8. Make webhooks idempotent.
9. Use integer minor units for money.
10. Prefer accessible and responsive UI.
11. Test meaningful behavior.
12. Avoid unnecessary dependencies.
13. Avoid unrelated refactoring.
14. Keep README synchronized with meaningful project changes.
15. Use Agent Skills selectively.
16. Never invent project facts.
17. Treat the repository as the source of truth.