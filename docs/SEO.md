# SEO & Rankings

This doc summarizes the SEO setup for higher visibility and rankings.

## Implemented

### Structured data (JSON-LD)
- **Root layout:** `WebSite` + `Organization` with `SearchAction` (eligible for sitelinks search box in Google).
- **Tool pages (`/app/[slug]`):** `SoftwareApplication` with name, description, url, image, offers (for free tools).
- **Category/Task slug pages:** `BreadcrumbList` (Home → Category/Task) and `ItemList` (first 10 tools).

### Meta & Open Graph
- **Root layout:** `metadataBase`, default title template (`%s | AiBDE`), description, keywords, `openGraph`, `twitter`, `robots`, `applicationName`.
- **Key pages:** Unique `title`, `description`, `keywords`, `openGraph`, `twitter`, `alternates.canonical`, and `robots` where needed (home, search, category, tasks, category slug, task slug, tool detail).
- All canonical and OG URLs use `SEO.siteUrl` from `lib/seo.ts` (env: `NEXT_PUBLIC_SITE_URL`).

### Sitemap & robots
- **`/sitemap.xml`:** Home, about, privacy, terms, submit, search, **/category**, **/tasks**, all tool pages, category slug pages, task slug pages. Category/task URLs use the same `slugify` as the app (lowercase, spaces → `-`, strip non-alphanumeric).
- **`/robots.txt`:** Allow `/`, disallow `/dashboard/`, `/api/`, `/_next/`, sitemap URL.

### Semantic HTML
- Public pages are wrapped in `<main>` (LayoutWrapper).
- Each key page has a single `<h1>`; hierarchy is consistent.

## Tips for higher rankings
- Keep **Core Web Vitals** healthy (LCP, INP, CLS); the app uses Next.js ISR and minimal blocking.
- Add a **default OG image** in layout metadata if you have a brand image.
- Keep **titles** under ~60 chars and **descriptions** under ~155 for snippets.
- Use **internal links** (category/task bars, related tools) as already present.
