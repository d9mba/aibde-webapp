**# Global Agent Guidelines — BrowseForAI**

Repository: \`d9mba/aibde-webapp\`

These instructions apply to all AI-assisted development, debugging, refactoring, testing, documentation, and maintenance work in this repository.

The goal is to make changes that are correct, secure, maintainable, performant, accessible, well-tested, and consistent with the existing architecture.

\---

**## 1. Project Context**

BrowseForAI is an AI-tool discovery and directory platform.

The application includes:

\- AI tool discovery

\- Search

\- Categories

\- Tool pages

\- Tool submissions

\- User accounts

\- Authentication

\- Custom authentication UI

\- Articles and news

\- SEO

\- Analytics

\- Payments

\- Webhooks

\- Media uploads

\- Administrative workflows

\- APIs

\- Responsive web experiences

The repository is the source of truth.

Do not assume a technology or feature exists simply because it is related to an AI directory. Inspect the actual implementation before making architectural decisions.

\---

**## 2. Core Technology Stack**

The current application uses:

\- Next.js 16

\- App Router

\- React 19

\- TypeScript 5

\- Tailwind CSS

\- Supabase / PostgreSQL

\- Clerk

\- Cloudflare R2

\- AWS S3-compatible SDK for R2

\- Upstash Redis

\- Dodo Payments

\- PostHog

\- Zod

\- Playwright

\- Sharp

Always verify the actual installed versions and existing implementation before introducing version-specific patterns.

Do not introduce competing technologies without a clear technical reason.

\---

**## 3. Understand Before Changing**

Before modifying existing functionality:

1\. Inspect the relevant implementation.

2\. Search for existing components, utilities, services, hooks, types, schemas, and data modules.

3\. Read relevant documentation.

4\. Understand the existing data flow.

5\. Understand server/client boundaries.

6\. Understand authentication and authorization requirements.

7\. Identify relevant tests.

8\. Determine whether documentation needs updating.

Do not immediately start coding based only on the task description.

For significant tasks, create a concise implementation plan before making changes.

For trivial tasks, avoid unnecessary planning overhead.

\---

**## 4. Architecture and Code Organization**

Follow the existing repository architecture.

Prefer existing:

\- abstractions

\- services

\- data modules

\- hooks

\- components

\- schemas

\- utilities

\- error-handling patterns

Do not duplicate functionality that already exists.

Do not introduce a new architectural pattern when an existing project pattern is appropriate.

Avoid unrelated refactoring while implementing a feature.

If an existing abstraction must be changed, understand its consumers before modifying it.

\---

**## 5. Database and Data Access**

Centralized data-access modules under:

\`src/lib/data/\`

are the preferred way to access application data.

Existing modules include:

\- \`tools.ts\`

\- \`categories.ts\`

\- \`counts.ts\`

\- \`search.ts\`

\- \`related.ts\`

Do not write raw database queries directly inside React components.

Prefer the existing data layer and established query patterns.

Avoid:

\- N+1 queries

\- unnecessary repeated queries

\- fetching unused data

\- exposing privileged database operations to clients

\---

**## 6. Supabase**

Supabase/PostgreSQL is the application's database platform.

**### Public/User Context**

Use:

\`createClient()\` from \`src/lib/supabase/server.ts\`

for normal server-side user/public operations.

**### Privileged Context**

Use:

\`createAdminClient()\` or the existing \`supabaseAdmin\` abstraction only when a privileged server-side operation intentionally requires bypassing Row Level Security.

Admin clients must remain server-side.

Never expose service-role credentials to the browser.

Do not bypass RLS for convenience.

Every privileged operation must have an explicit authorization reason.

\---

**## 7. Next.js**

Follow the Next.js App Router architecture.

**### Server Components**

Prefer Server Components by default.

Use Client Components only when client-side behavior actually requires them, such as:

\- browser APIs

\- event handlers

\- client-side state

\- subscriptions

\- interactive UI

Do not add \`"use client"\` unnecessarily.

**### Server-Only Code**

Keep the following server-side:

\- secrets

\- privileged database operations

\- payment operations

\- webhook processing

\- storage credentials

\- sensitive authentication operations

\- private API calls

Never import server-only functionality into client components.

**### Routing**

Follow existing patterns for:

\- routes

\- layouts

\- loading states

\- error states

\- metadata

\- caching

\- revalidation

Do not introduce competing routing conventions.

\---

**## 8. React and TypeScript**

Maintain strong TypeScript safety.

Prefer existing project types.

Avoid \`any\` unless there is a specific and unavoidable reason.

Do not duplicate types that already exist.

Keep components:

\- focused

\- readable

\- composable

\- accessible

Avoid unnecessarily large components.

Follow existing naming and file organization conventions.

\---

**## 9. Frontend UI and UX**

UI quality is a major priority for BrowseForAI.

Use the existing design system.

Use Tailwind CSS variables from:

\`src/styles/globals.css\`

including existing semantic variables such as:

\- \`--bg-primary\`

\- \`--bg-card\`

\- \`--accent-primary\`

Do not introduce arbitrary design tokens when existing ones apply.

New UI should be:

\- responsive

\- accessible

\- keyboard usable

\- mobile friendly

\- performant

\- visually consistent

\- compatible with the existing light/dark theme

Use semantic HTML.

Use ARIA only where appropriate.

Before creating a new component:

1\. Search for an existing equivalent.

2\. Determine whether an existing component can be extended.

3\. Follow established project conventions.

Avoid duplicate buttons, cards, forms, modals, navigation components, and similar UI primitives.

\---

**## 10. Forms**

Forms must provide appropriate:

\- labels

\- validation

\- error messages

\- loading states

\- disabled states

\- success states

\- accessibility

\- mobile behavior

Always validate important data server-side.

Client-side validation is not a security boundary.

\---

**## 11. Authentication**

Clerk is the authentication system.

Do not introduce another authentication system.

Authentication and authorization are separate concerns.

**### Authentication**

Use Clerk for:

\- sign-in

\- sign-up

\- sessions

\- user identity

\- account management

**### Authorization**

Authorization must be enforced server-side.

Never rely solely on:

\- hidden UI

\- disabled buttons

\- client-side checks

\- frontend route protection

for privileged operations.

Perform authorization checks at the server boundary.

\---

**## 12. Custom Authentication UI**

BrowseForAI may use custom-designed login and signup pages.

Custom authentication UI is allowed and encouraged when it improves the product experience.

However:

\> Custom UI does not mean custom authentication security.

Use Clerk for the underlying:

\- authentication

\- sessions

\- security

\- identity

\- token handling

Custom authentication pages should:

\- integrate correctly with Clerk

\- preserve Clerk security behavior

\- support loading states

\- handle authentication errors

\- be responsive

\- be accessible

\- follow the BrowseForAI design system

Do not manually implement password storage, session management, token signing, or equivalent authentication infrastructure when Clerk provides it.

\---

**## 13. Authentication Testing**

Authentication changes should consider:

\- sign-in

\- sign-up

\- sign-out

\- protected routes

\- unauthenticated access

\- authenticated access

\- authorization boundaries

\- admin access

\- invalid credentials

\- authentication failures

\- session handling

\- custom login UI

\- custom signup UI

Do not test only the happy path.

\---

**## 14. API Development**

API endpoints must follow existing Next.js Route Handler patterns.

APIs should provide:

\- request validation

\- appropriate HTTP status codes

\- predictable response structures

\- useful error responses

\- authentication where required

\- authorization where required

\- rate limiting where appropriate

\- server-side validation

\- secure input handling

Use Zod for request validation where appropriate.

Never trust client-provided input.

Validate:

\- request bodies

\- query parameters

\- route parameters

\- relevant headers

\- uploaded metadata

\---

**## 15. API Security**

Every API endpoint should be evaluated for:

\- authentication

\- authorization

\- input validation

\- rate limiting

\- abuse

\- sensitive information disclosure

\- excessive data exposure

\- injection

\- replay/duplicate requests where relevant

Public endpoints must be intentionally public.

Do not expose internal database structures unnecessarily.

Do not return secrets or privileged fields.

\---

**## 16. API Testing**

API testing is required for meaningful API changes.

Test relevant:

**### Success Cases**

\- valid requests

\- authenticated requests

\- authorized requests

\- expected response structures

**### Failure Cases**

\- malformed requests

\- missing parameters

\- invalid parameters

\- invalid payloads

\- unauthenticated requests

\- unauthorized requests

\- forbidden operations

\- missing resources

\- server errors

**### Edge Cases**

\- duplicate requests

\- rate limits

\- pagination boundaries

\- empty results

\- unexpected input

\- oversized input where relevant

Do not test only HTTP 200 responses.

Use the existing repository testing infrastructure rather than introducing a new framework unnecessarily.

\---

**## 17. Security and Defense in Depth**

Security is a first-class requirement.

**### Secrets**

Never:

\- hardcode secrets

\- log secrets

\- commit secrets

\- expose secrets to client code

\- place secrets in documentation

\- place secret values inside Agent Skills

Sensitive values include:

\- \`SUPABASE\_SERVICE\_ROLE\_KEY\`

\- \`CLERK\_SECRET\_KEY\`

\- \`ADMIN\_LOGIN\_SECRET\`

\- \`DODO\_PAYMENTS\_API\_KEY\`

\- R2 credentials

\- webhook secrets

\- private API keys

Environment-variable names may be documented when necessary.

Never document their actual values.

**### Timing Attacks**

Use constant-time comparison for security-sensitive tokens, HMAC values, and secret validation where applicable.

Prefer mechanisms such as:

\- \`crypto.timingSafeEqual\`

\- appropriate Web Crypto APIs

**### Input Validation**

Validate untrusted input using Zod or established repository schemas.

Never trust:

\- request bodies

\- query parameters

\- route parameters

\- headers

\- cookies

\- uploaded metadata

\- user-submitted content

**### HTML Sanitization**

Sanitize user-submitted HTML using the existing DOMPurify-based implementation such as:

\`sanitizeHtml\`

before rendering or storing where applicable.

\---

**## 18. Rate Limiting**

Use the existing Upstash Redis rate-limiting infrastructure for public or abuse-prone operations where appropriate.

Pay particular attention to:

\- tool submissions

\- contact forms

\- votes

\- uploads

\- public mutations

\- expensive API operations

\- authentication-related abuse

Use the existing:

\`src/lib/rate-limit.ts\`

patterns.

Do not create a second rate-limiting system unnecessarily.

\---

**## 19. Cloudflare R2**

Object storage uses Cloudflare R2 through the existing S3-compatible implementation.

The primary storage abstraction is:

\`src/services/storage.service.ts\`

Use the existing storage service.

Do not bypass it unnecessarily.

Do not introduce Wrangler storage bindings when the existing S3-compatible architecture is appropriate.

Keep storage credentials server-side.

Validate uploaded files and metadata appropriately.

\---

**## 20. Payments**

Dodo Payments is the payment platform.

Use the existing Dodo integration.

Do not introduce another payment provider unless explicitly required.

Payment logic involving credentials or privileged operations must remain server-side.

\---

**## 21. Currency**

Never rely on floating-point arithmetic for monetary calculations.

Use integer minor units for:

\- prices

\- taxes

\- discounts

\- totals

\- payment amounts

Preserve exact arithmetic throughout payment-related flows.

\---

**## 22. Webhooks**

Webhook handlers must be designed for retries and duplicate delivery.

Every webhook should be:

\- verified

\- validated

\- idempotent

\- retry-safe

\- duplicate-safe

Preserve existing atomic status-transition patterns.

Do not assume webhook delivery occurs exactly once.

Do not mark an event successfully processed before the required operation has actually succeeded.

\---

**## 23. Articles and News**

BrowseForAI will maintain articles, news, and other editorial content.

Content should be:

\- factual

\- clear

\- authoritative

\- useful

\- readable

\- SEO-aware

\- appropriately structured

Avoid:

\- fabricated claims

\- unsupported statistics

\- fake quotes

\- invented sources

\- misleading headlines

\- unnecessary clickbait

\- repetitive filler

Use a consistent BrowseForAI editorial voice.

\---

**## 24. News Writing**

News content requires additional factual discipline.

Clearly distinguish between:

\- confirmed information

\- reported information

\- analysis

\- speculation

When source information is available, preserve appropriate attribution.

Never fabricate:

\- quotes

\- announcements

\- statistics

\- company statements

\- dates

\- product capabilities

Prioritize factual accuracy over sensationalism.

\---

**## 25. SEO and Content**

For public content, consider:

\- title metadata

\- meta descriptions

\- canonical URLs

\- Open Graph metadata

\- social metadata where applicable

\- structured data where appropriate

\- semantic headings

\- clean URLs/slugs

\- internal linking

\- image metadata

\- indexability

Do not add SEO markup simply for the sake of adding markup.

Metadata must accurately describe the page.

Never use misleading SEO content.

\---

**## 26. Article Testing**

When article/news functionality changes, test relevant behavior such as:

\- article rendering

\- slugs

\- metadata

\- links

\- publishing state

\- structured content

\- responsive layouts

\- missing content

\- invalid content

\- SEO metadata

Use the existing testing infrastructure.

\---

**## 27. Performance**

Performance is important for BrowseForAI because the platform contains large tool and search experiences.

Avoid:

\- unnecessary client components

\- excessive JavaScript

\- duplicate requests

\- N+1 queries

\- oversized payloads

\- unnecessary database calls

\- unoptimized images

\- unnecessary re-renders

\- blocking operations

\- redundant API calls

Use appropriate:

\- server rendering

\- caching

\- revalidation

\- pagination

\- image optimization

\- lazy loading

Do not assume an optimization is beneficial without validation when practical.

\---

**## 28. Accessibility**

New functionality should follow good accessibility practices.

Consider:

\- keyboard navigation

\- focus management

\- semantic HTML

\- labels

\- accessible names

\- contrast

\- reduced-motion preferences

\- screen-reader behavior

\- form errors

\- loading states

Do not rely on color alone to communicate state.

\---

**## 29. Testing Strategy**

Use the existing repository testing infrastructure.

Prefer the appropriate level of testing.

**### Unit Tests**

Use for isolated utilities and logic.

**### Integration/API Tests**

Use for:

\- API routes

\- data operations

\- authentication boundaries

\- webhooks

\- server-side functionality

**### End-to-End Tests**

Use for important user journeys such as:

\- authentication

\- search

\- tool discovery

\- submissions

\- checkout

\- critical account flows

Do not create tests purely to increase coverage numbers.

Tests should protect meaningful behavior.

\---

**## 30. Debugging**

When fixing a bug:

1\. Reproduce the issue when possible.

2\. Identify the root cause.

3\. Inspect related code.

4\. Implement the smallest correct fix.

5\. Add or update regression coverage where appropriate.

6\. Run relevant validation.

7\. Check for side effects.

Do not hide symptoms with arbitrary conditionals.

Do not rewrite large sections of the application to fix a localized issue unless necessary.

\---

**## 31. Planning Significant Work**

For significant features or architectural changes:

1\. Understand the requirement.

2\. Inspect the existing implementation.

3\. Identify affected systems.

4\. Identify dependencies.

5\. Identify risks.

6\. Create an implementation plan.

7\. Implement incrementally.

8\. Validate each important part.

9\. Update documentation.

10\. Review the final diff.

Planning should be proportional to task complexity.

Do not create elaborate plans for trivial changes.

\---

**## 32. Dependencies**

Before adding a package:

1\. Check whether an existing package already solves the problem.

2\. Check whether Next.js, React, or another existing platform dependency provides the functionality.

3\. Consider bundle size.

4\. Consider maintenance.

5\. Consider security.

6\. Consider whether the dependency is actively maintained.

Do not add dependencies merely for convenience.

After adding a meaningful dependency, evaluate whether README documentation needs updating.

\---

**## 33. Scope Discipline**

Only modify what is necessary for the requested task.

Do not silently expand scope.

Avoid unrelated:

\- refactors

\- formatting changes

\- dependency upgrades

\- architecture changes

\- database changes

\- UI rewrites

\- configuration changes

If an unrelated issue is discovered, mention it separately instead of silently expanding the task.

\---

**## 34. Git and Change Discipline**

Keep changes easy to review.

Prefer:

\- focused commits

\- logically grouped changes

\- meaningful commit messages

\- clean diffs

Never commit:

\- credentials

\- API keys

\- private tokens

\- local environment secrets

\- unnecessary build artifacts

Before completing significant work, review the final diff.

\---

**## 35. Documentation**

Documentation is part of the product.

Before meaningful changes:

1\. Read relevant documentation.

2\. Determine whether the implementation affects documented behavior.

3\. Update affected documentation as part of the same task.

Do not create duplicate documentation when an existing document is the appropriate source of truth.

\---

**## 36. Mandatory README Maintenance**

The root:

\`README.md\`

is the primary human-readable overview of BrowseForAI.

It must remain synchronized with the actual repository.

**### Before Meaningful Development**

Read the relevant README sections before implementing meaningful changes.

**### After Meaningful Development**

Determine whether the README is affected.

README MUST be updated when a change affects:

\- features

\- capabilities

\- architecture

\- APIs

\- integrations

\- authentication

\- payments

\- storage

\- deployment

\- setup instructions

\- environment variables

\- significant user workflows

\- major milestones

\- important project status

\- significant dependencies

README does NOT need to change for:

\- trivial bug fixes

\- internal refactoring

\- formatting-only changes

\- variable renaming

\- implementation details that do not affect documented behavior

**### README Rules**

\- Update only affected sections.

\- Never blindly rewrite the README.

\- Preserve useful badges.

\- Preserve useful links.

\- Preserve useful examples.

\- Preserve the existing structure where appropriate.

\- Remove obsolete information.

\- Do not invent features.

\- Do not invent metrics.

\- Do not invent roadmap items.

\- Do not claim production readiness without evidence.

The README must describe the project as it actually exists.

\---

**## 37. Project Status**

Do not create a separate \`project-status\` skill or project-status document unless explicitly requested.

The README may contain a concise current-status section.

When significant functionality is:

\- completed

\- added

\- removed

\- changed

\- deprecated

update the relevant README status information when appropriate.

Do not turn the README into a detailed development diary.

\---

**## 38. Agent Skills**

Specialized skills are located under:

\`.agents/skills/\`

Use skills selectively.

Do not load every skill for every task.

Use the smallest relevant set of high-quality skills.

Prefer project-specific skills over generic guidance.

Do not create duplicate skills.

Do not install a skill merely because it sounds useful.

A skill should be retained only when it materially helps development or maintenance of this repository.

\---

**## 39. Skill Priorities**

The most important skill areas for BrowseForAI are:

**### Tier 1 — Essential**

\- project architecture

\- Next.js

\- React/TypeScript

\- frontend UI/UX

\- backend/API

\- Supabase/Postgres

\- Clerk authentication

\- security

\- testing

\- API testing

\- README/documentation

**### Tier 2 — Important**

\- custom authentication UI

\- authentication testing

\- articles/news writing

\- SEO/content

\- webhooks

\- Dodo Payments

\- performance

\- Cloudflare R2

\- Upstash/rate limiting

\- Vercel deployment

\- planning

**### Tier 3 — Conditional**

\- animations/motion

\- advanced Vercel-specific patterns

\- promotions

\- localized pricing

\- product catalog management

\- generic writing

\- framework adapters

\- unrelated integrations

Do not retain Tier 3 skills unless the repository actually benefits from them.

\---

**## 40. AI and LLM Skills**

BrowseForAI is an application about AI tools.

That does not automatically mean the project requires:

\- OpenAI SDK skills

\- Anthropic skills

\- generic LLM skills

\- prompt-engineering skills

\- agent skills

\- AI SDK skills

Only use these skills if the actual application code meaningfully integrates or develops these technologies.

Do not confuse an AI-tool directory with an LLM-powered application.

\---

**## 41. Validation Before Completion**

Before considering meaningful development complete:

\- implementation is complete

\- relevant tests were run

\- relevant type checking was run

\- relevant linting was run

\- build validation was performed when appropriate

\- affected user flows were checked when practical

\- security implications were considered

\- README was reviewed

\- README was updated if required

\- no secrets were exposed

\- no unrelated files were unnecessarily modified

\- final diff was reviewed

Never claim a check was performed if it was not actually performed.

\---

**## 42. Final Response**

When completing a development task, provide a concise summary containing:

**### Changed**

What was implemented.

**### Files**

Important files changed.

**### Validation**

Tests and checks actually performed.

**### Documentation**

State whether README was updated.

If README was not updated, briefly explain why it was not affected.

**### Remaining**

Known issues, limitations, or follow-up work.

Do not claim functionality that was not implemented.

Do not claim tests passed if they were not run.

\---

**## 43. Non-Negotiable Principles**

1\. Inspect before changing.

2\. Understand existing architecture before introducing new patterns.

3\. Reuse existing components, utilities, services, and data modules.

4\. Keep server-only code server-side.

5\. Never expose secrets.

6\. Validate all untrusted input.

7\. Enforce authorization server-side.

8\. Make webhooks idempotent.

9\. Use integer minor units for money.

10\. Prefer accessible and responsive UI.

11\. Test meaningful behavior.

12\. Avoid unnecessary dependencies.

13\. Avoid unrelated refactoring.

14\. Keep README synchronized with meaningful project changes.

15\. Use Agent Skills selectively.

16\. Never invent project facts.

17\. Treat the repository as the source of truth.
---

# 44. Production AI Engineering Operating Standard

These rules extend the repository-specific guidelines above. They are intended to keep Claude Code, OpenAI Codex, Google Antigravity, and other AI coding agents aligned while preserving the existing BrowseForAI architecture.

## 44.1 Authority and Precedence

- The repository is the source of truth.
- Existing working code, configuration, schemas, tests, and documented project conventions take precedence over generic AI-generated patterns.
- These guidelines strengthen the existing architecture; they do not authorize replacing established systems merely because a newer library or pattern exists.
- When two instructions appear to conflict, preserve security, correctness, compatibility, and the existing project architecture first.
- Never invent repository facts, installed packages, routes, components, APIs, environment variables, database tables, or product requirements.
- Verify uncertain facts by inspecting the repository.

## 44.2 Mandatory Repository Audit Before Coding

For meaningful work, an AI agent MUST perform a repository audit before implementation.

At minimum inspect:

1. `AGENTS.md` and relevant Agent Skills.
2. `README.md` and relevant documentation.
3. `package.json` and lockfile when dependency/version questions matter.
4. Relevant application routes and layouts.
5. Existing components and UI primitives.
6. Existing data-access modules and schemas.
7. Authentication and authorization boundaries.
8. Existing API handlers and services.
9. Relevant tests.
10. Existing styling/design tokens.
11. Relevant configuration files.
12. Existing implementation of the feature being changed.

Before creating anything new, search for an equivalent or extendable implementation.

Do not begin by generating a large replacement architecture from the task description alone.

## 44.3 Understand the Product Before Designing the Solution

Before significant feature work, establish:

- what problem the feature solves
- who uses it
- the primary user journey
- entry points
- success states
- empty states
- loading states
- error states
- permission boundaries
- data dependencies
- responsive behavior
- accessibility requirements
- SEO implications for public pages
- analytics requirements where applicable
- security and abuse considerations
- testing requirements
- documentation impact

If requirements are ambiguous, use the existing product behavior and repository documentation as the first source of truth. Do not silently invent product behavior.

## 44.4 Documentation-First Planning for Significant Work

For significant features, architectural changes, or multi-step product work, reason through the following artifacts before implementation when they materially help the task:

- PRD / product requirements
- user flow
- design brief
- data model
- technical design / TDD
- engineering implementation plan
- testing plan
- launch checklist
- PWA/offline considerations where relevant

These artifacts may be concise. Do not create ceremony for trivial changes.

The plan should identify:

- scope
- non-goals
- affected files/systems
- reuse opportunities
- dependencies
- risks
- migrations
- API changes
- authorization boundaries
- test coverage
- rollout/rollback considerations
- documentation updates

## 44.5 Implementation Strategy

Implement incrementally.

Preferred sequence:

1. Audit.
2. Plan.
3. Reuse existing infrastructure.
4. Implement the smallest coherent change.
5. Validate locally.
6. Add regression coverage.
7. Review accessibility, security, performance, and responsive behavior.
8. Update documentation.
9. Review the final diff.
10. Report exactly what was done and verified.

Avoid speculative abstractions and premature generalization.

## 44.6 UI Component Decision Hierarchy

When building or changing UI, use this order of preference:

1. Existing BrowseForAI component or pattern.
2. Existing shared project utility/component.
3. Existing shadcn/ui or Base UI primitive if present and compatible with the repository.
4. Existing project-specific composition around those primitives.
5. Optional KokonutUI component when it provides a meaningful visual/interaction pattern that the project does not already have.
6. A custom component when the existing systems cannot satisfy the requirement cleanly.

Do not install a UI library simply to obtain one component.

Do not replace existing BrowseForAI components merely because another library has a visually newer equivalent.

## 44.7 UI Inspiration and External Component Sources

21st.dev may be used as an inspiration or pattern reference when useful.

Rules:

- Treat external component examples as references, not repository architecture.
- Adapt patterns to BrowseForAI's existing design system, accessibility requirements, dependency policy, and code conventions.
- Do not blindly copy generated code.
- Review security, bundle size, maintainability, responsive behavior, and accessibility before adoption.
- Do not introduce a new component framework solely because an external example uses it.

## 44.8 Data Visualization

For data-heavy interfaces, dashboards, analytics, and reporting:

- Reuse an existing project visualization solution first.
- Bklit may be considered for specialized visualization needs when it materially improves the result.
- Tremor may be considered for dashboard and analytics patterns when appropriate.
- Prefer simple, readable visualizations over decorative complexity.
- Ensure charts have accessible labels or equivalent textual interpretation where required.
- Do not add a visualization dependency for a simple metric that can be represented with existing UI.

## 44.9 Advanced Accessibility Primitives

React Aria may be considered for complex interactive accessibility requirements when existing project primitives are insufficient.

Use it selectively for cases such as:

- complex menus
- listboxes
- comboboxes
- dialogs
- drag-and-drop interactions
- advanced keyboard interaction
- focus management
- other interaction-heavy primitives

Do not introduce React Aria when semantic HTML and existing components already solve the problem correctly.

## 44.10 Animation and Motion Hierarchy

Animation must serve usability, hierarchy, feedback, or product character. Avoid motion for decoration alone.

Preferred hierarchy:

1. CSS transitions/animations for simple state changes.
2. Motion for standard React interaction and layout animation when available or justified.
3. GSAP for advanced timelines, scroll-linked effects, or cinematic sequences that genuinely require it.
4. Anime.js for specialized lightweight animation cases where it is a better fit.

Respect `prefers-reduced-motion`.

Do not add multiple animation libraries to solve overlapping problems.

Do not introduce Motion, GSAP, or Anime.js unless the package is already installed or the dependency is specifically justified and approved by the dependency rules.

## 44.11 Icons

Use Lucide icons where the repository already uses Lucide or where a new icon is needed and Lucide provides a suitable symbol.

Rules:

- Do not use arbitrary Unicode characters as interface icons when a proper icon exists.
- Do not mix unrelated icon libraries without a clear reason.
- Keep icon sizing and alignment consistent.
- Provide accessible labels for icon-only controls.
- Do not use icons as a substitute for clear text when the meaning would otherwise be ambiguous.

## 44.12 Forms and Validation Standard

For complex forms, prefer the existing React Hook Form + Zod patterns when those dependencies are present and appropriate.

Use:

- controlled validation boundaries appropriate to the form
- shared Zod schemas where they are the existing source of truth
- server-side validation for all security-sensitive operations
- clear field-level errors
- form-level errors when appropriate
- loading/submission states
- disabled states that do not replace authorization
- success feedback
- keyboard accessibility
- mobile-friendly layouts

Do not duplicate validation logic unnecessarily.

## 44.13 Responsive and Mobile-First Design

All new public-facing UI should be designed mobile-first unless the feature is inherently desktop-only.

Check at minimum:

- narrow mobile viewport
- normal mobile viewport
- tablet
- desktop
- large desktop where layout may stretch

Responsive behavior must cover:

- navigation
- typography
- spacing
- grids
- tables
- cards
- forms
- dialogs
- menus
- tooltips
- images/media
- overflow
- touch targets

Do not treat responsiveness as a final cosmetic patch.

## 44.14 UI State Completeness

Every meaningful interactive or data-driven UI should account for relevant states:

- initial
- loading
- success
- empty
- error
- disabled
- permission denied
- partial data
- retry
- offline/unavailable where applicable

Avoid layouts that only look correct when populated with ideal data.

## 44.15 Visual Quality Standard

UI should be coherent with BrowseForAI rather than looking like an unrelated template.

Review:

- typography hierarchy
- spacing rhythm
- alignment
- component consistency
- contrast
- borders and surfaces
- hover/focus/active states
- empty states
- error states
- responsive composition
- dark/light theme behavior
- motion restraint

Prefer semantic design tokens over scattered arbitrary values.

## 44.16 SEO Standard

For public, indexable pages, evaluate:

- title
- description
- canonical URL
- Open Graph metadata
- relevant social metadata
- semantic heading hierarchy
- clean URL structure
- structured data when genuinely applicable
- internal linking
- image metadata
- indexability
- sitemap/robots implications where applicable

SEO metadata must reflect the actual page content.

Do not generate keyword-stuffed or misleading content.

## 44.17 PWA and Offline Considerations

When a task touches installability, mobile app-like behavior, caching, offline behavior, or service workers, first inspect the repository for existing PWA infrastructure.

Do not add a second service-worker or caching architecture.

When offline behavior is required, explicitly define:

- what works offline
- what is read-only offline
- what is queued for later
- how stale data is represented
- what happens when synchronization fails
- how authentication affects offline access
- how conflicts are resolved

Never imply that a feature is offline-capable unless it has actually been implemented and tested.

## 44.18 Performance Engineering

Performance work must be evidence-driven where practical.

Prioritize:

- server rendering where appropriate
- minimizing client JavaScript
- avoiding unnecessary `use client`
- avoiding duplicate requests
- efficient data access
- pagination for large collections
- image optimization
- lazy loading where useful
- caching/revalidation where appropriate
- minimizing unnecessary re-renders
- reducing oversized payloads
- avoiding blocking work on critical paths

Do not optimize blindly or introduce complexity without measurable benefit.

## 44.19 Dependency Decision Matrix

Before adding a dependency, evaluate:

| Question | Requirement |
|---|---|
| Existing solution? | Prefer existing code/package |
| Platform solution? | Prefer Next.js/React/browser capability where appropriate |
| Architectural fit? | Must fit existing conventions |
| Security? | Must be acceptable |
| Maintenance? | Must be reasonably maintained |
| Bundle/runtime cost? | Must be justified |
| Accessibility? | Must meet project requirements |
| Duplication? | Must not create competing systems |
| Scope? | Must directly support the task |
| Documentation? | Update README/docs when meaningful |

A dependency is justified only when its value outweighs its cost and existing solutions are insufficient.

## 44.20 Dependency Rules for Optional UI/AI Libraries

The following technologies are optional capabilities, not assumed installed dependencies:

- shadcn/ui / Base UI
- KokonutUI
- 21st.dev patterns
- Bklit
- Tremor
- React Aria
- Motion
- GSAP
- Anime.js

Before using any of them:

1. Inspect `package.json` and lockfile.
2. Confirm compatibility with the current stack.
3. Check whether the requirement can be satisfied without the dependency.
4. Confirm the dependency will not create a competing system.
5. Justify the dependency when adding it.
6. Keep the change scoped.

Never state that one of these libraries is installed unless repository inspection confirms it.

## 44.21 Security Review for New Features

For every meaningful feature, ask:

- What inputs are untrusted?
- What data is sensitive?
- Who is authenticated?
- Who is authorized?
- Can the client bypass the intended restriction?
- Is rate limiting required?
- Can requests be replayed?
- Can the operation be duplicated?
- Are uploads validated?
- Is user content sanitized?
- Are secrets kept server-side?
- Could error messages leak internal details?
- Could logs leak sensitive data?
- Could the feature introduce abuse or resource exhaustion?

Security controls must exist at the actual trust boundary, not merely in the UI.

## 44.22 Testing Standard for New Features

Testing should follow risk and behavior, not arbitrary coverage targets.

At minimum, consider:

- unit tests for isolated business logic
- integration/API tests for server boundaries
- authorization tests for privileged behavior
- regression tests for fixed bugs
- Playwright E2E tests for important user journeys
- responsive/accessibility checks for meaningful UI changes

Important flows should cover both success and failure behavior.

## 44.23 Production Readiness Gate

Before declaring a significant feature complete, verify as applicable:

- functionality works
- existing behavior is preserved
- type checking passes
- linting passes
- relevant tests pass
- relevant E2E flows pass
- build succeeds when appropriate
- authorization is enforced
- inputs are validated
- secrets remain protected
- rate limiting is considered
- webhook/idempotency behavior is safe where relevant
- responsive behavior works
- accessibility is acceptable
- loading/empty/error states exist
- SEO is correct for public pages
- performance risks were reviewed
- documentation is synchronized
- README impact was evaluated
- final diff contains no accidental unrelated changes

Never claim a check was run unless it was actually run.

## 44.24 Change Review Checklist

Before finishing:

### Architecture

- Did I reuse the existing architecture?
- Did I avoid creating a competing abstraction?
- Did I preserve server/client boundaries?

### UI

- Did I reuse existing components?
- Is the UI responsive?
- Is it accessible?
- Are all meaningful states covered?
- Does it match BrowseForAI?

### Security

- Are inputs validated?
- Is authorization enforced server-side?
- Are secrets protected?
- Is abuse/rate limiting considered?

### Data

- Did I avoid N+1 queries?
- Did I reuse the data layer?
- Did I avoid unnecessary data fetching?

### Performance

- Did I avoid unnecessary client JavaScript?
- Did I avoid duplicate requests?
- Did I optimize images and payloads appropriately?

### Testing

- Did I test the meaningful behavior?
- Did I test important failure/edge cases?
- Did I add regression coverage where appropriate?

### Documentation

- Is README.md synchronized?
- Are relevant docs/plans updated?

### Scope

- Did I avoid unrelated refactoring?
- Did I avoid unnecessary dependency changes?
- Is the final diff focused?

## 44.25 Multi-Agent Consistency

These rules are designed to be shared by Claude Code, OpenAI Codex, Google Antigravity, and other coding agents.

Agents must:

- treat the repository as authoritative
- inspect before modifying
- preserve existing architecture
- use the same dependency discipline
- use the same security boundaries
- use the same testing expectations
- report validation honestly
- avoid tool-specific assumptions

Do not create agent-specific implementations when a shared repository implementation is appropriate.

If another agent has already implemented a solution, inspect and extend it rather than creating a parallel solution.

## 44.26 Final Agent Response Contract

For completed development work, report:

### Changed

- What changed.
- Why it changed when useful.

### Files

- Important files created, modified, or removed.

### Validation

- Exact checks actually run.
- Exact tests actually run.
- Any checks not run.

### Documentation

- Whether README/docs were updated.
- If not, why they were unaffected.

### Risks / Remaining

- Known limitations.
- Follow-up work.
- Unverified areas.

Never report hypothetical validation as completed validation.

---

# 45. Master Engineering Workflow

Use the following workflow as the default for meaningful implementation tasks.

## Phase 1 — Audit

- Read the relevant instructions and skills.
- Inspect the repository structure.
- Inspect existing implementation.
- Search for reusable code.
- Identify architecture and trust boundaries.

## Phase 2 — Define

- Clarify the requested behavior from available project evidence.
- Define scope and non-goals.
- Identify affected user flows.
- Identify security, accessibility, performance, SEO, and documentation requirements.

## Phase 3 — Design

- Prefer existing architecture.
- Select the smallest appropriate component/tooling strategy.
- Identify data/API changes.
- Identify tests.
- For significant work, prepare concise PRD/user-flow/design/data/TDD/engineering/launch artifacts as appropriate.

## Phase 4 — Implement

- Reuse existing components/services/utilities.
- Keep changes incremental.
- Maintain server/client boundaries.
- Validate all untrusted inputs.
- Keep authorization server-side.
- Avoid unrelated changes.

## Phase 5 — Verify

- Run relevant tests.
- Run type checking/linting as applicable.
- Run build validation when appropriate.
- Check responsive and accessible behavior.
- Review security and performance.
- Review the final diff.

## Phase 6 — Document

- Update README/docs when affected.
- Remove obsolete documentation.
- Do not invent status, capabilities, metrics, or roadmap items.

## Phase 7 — Report

- State exactly what changed.
- State exactly what was tested.
- State what was not tested.
- State remaining issues.

---

# 46. LLM Discoverability and `llms.txt`

`llms.txt` is a maintained project-facing documentation artifact for AI/LLM discoverability. It must remain consistent with the actual repository and public product.

## Before Meaningful Development

- Inspect the existing `llms.txt` when the task may affect information represented there.
- Treat the repository and actual implementation as the source of truth.

## After Meaningful Development

Review whether `llms.txt` is affected by changes to:

- public product capabilities
- major user workflows
- important routes or pages
- public APIs or integrations
- architecture or technical capabilities intentionally documented for AI systems
- major authentication, payments, storage, or platform integrations
- important project terminology or navigation information
- significant documentation or discoverability changes

When affected:

1. Update `llms.txt` in the same task.
2. Change only information that is actually affected.
3. Preserve useful existing structure and terminology unless there is a reason to improve it.
4. Keep descriptions concise, factual, and useful to AI systems.
5. Do not expose secrets, private implementation details, credentials, or sensitive information.
6. Do not invent features, APIs, routes, capabilities, metrics, or roadmap items.
7. Do not claim a capability merely because a dependency or library is installed.
8. Ensure links and documented paths are accurate when included.

`llms.txt` does not need to change for purely internal changes that do not affect its documented information.

`README.md` and `llms.txt` serve different purposes and must not be treated as interchangeable. Keep both synchronized with the real project when each is affected.

---

# 47. Final Quality Gate

A change is not production-ready merely because the code compiles.

Before declaring completion, the agent should be able to answer “yes” to the applicable questions:

- Does this follow the existing BrowseForAI architecture?
- Did I inspect before changing?
- Did I reuse existing functionality where possible?
- Did I avoid unnecessary dependencies?
- Is the server/client boundary correct?
- Is authentication handled by Clerk where applicable?
- Is authorization enforced server-side?
- Is Supabase/RLS usage correct?
- Are secrets protected?
- Is untrusted input validated?
- Are public/abuse-prone operations rate-limited where appropriate?
- Are webhooks verified and idempotent where applicable?
- Are monetary values represented safely?
- Is the UI responsive and accessible?
- Are loading, empty, error, success, and disabled states handled where relevant?
- Is SEO correct for public pages?
- Is performance acceptable?
- Are meaningful tests present and actually run?
- Is documentation synchronized?
- Is the final diff focused?
- Did I avoid claiming anything that I did not verify?

If any applicable answer is “no”, fix it or explicitly report the remaining limitation rather than declaring the task fully complete.

---

# 48. Non-Negotiable AI Engineering Principles

1. Inspect before changing.
2. Repository truth beats generic model knowledge.
3. Existing architecture beats fashionable replacement architecture.
4. Reuse before creating.
5. Extend before duplicating.
6. Security belongs at trust boundaries.
7. Client-side checks are not authorization.
8. Server-only code stays server-side.
9. Never expose secrets.
10. Validate untrusted input.
11. Prefer meaningful tests over coverage theater.
12. Design responsive and accessible UI from the beginning.
13. Use animation purposefully and respect reduced motion.
14. Do not add libraries merely because they are available.
15. Optional libraries are not installed until verified.
16. Keep public SEO truthful.
17. Treat offline/PWA behavior as an explicit capability, not an assumption.
18. Keep README and documentation synchronized with meaningful changes.
19. Avoid unrelated refactoring.
20. Review the final diff.
21. Keep `llms.txt` synchronized when its documented information is affected.
22. Report validation honestly.
23. Never invent project facts.
24. Build production-quality software, not demo-quality code.
25. Extend BrowseForAI's established engineering system; do not replace it without a justified requirement.
