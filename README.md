# AIBDE - AI Tool Directory

A modern, production-ready AI tool directory built with Next.js 16, Supabase, and Clerk authentication. Features 10,000+ AI tools with advanced search, categories, and admin dashboard.

**Live Site:** https://www.aibde.tech

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router, SSR, and Turbopack |
| **TypeScript** | Type-safe development |
| **Supabase** | PostgreSQL database with Row Level Security |
| **Clerk** | Authentication (admin dashboard protection) |
| **Cloudflare R2** | Image/video storage CDN |
| **Tailwind CSS** | Utility-first styling with CSS variables |
| **Sharp** | Image optimization (WebP conversion) |

---

## 📁 Project Structure

```
src/
├── app/                            # Next.js App Router
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout with analytics
│   ├── HomePageClient.tsx          # Client-side homepage logic
│   ├── home-components/            # Homepage sections
│   │   ├── HeroSection.tsx         # Hero with search
│   │   ├── SpotlightSection.tsx    # Featured tools
│   │   ├── TrendingSection.tsx     # Trending tools
│   │   ├── CategoriesSection.tsx   # Category grid
│   │   └── TasksSection.tsx        # Task grid
│   │
│   ├── app/[slug]/                 # Tool detail pages
│   ├── category/                   # Category pages
│   │   ├── page.tsx                # All categories grid
│   │   └── [slug]/                 # Single category
│   ├── task/[slug]/                # Task detail pages
│   ├── tasks/                      # All tasks page
│   ├── search/                     # Search page
│   │   ├── page.tsx                # SSR search page
│   │   └── SearchPageClient.tsx    # Client-side search logic
│   ├── trending/                   # Trending tools page
│   │
│   ├── dashboard/                  # Admin dashboard (protected)
│   │   ├── page.tsx                # Dashboard home
│   │   ├── tools/                  # Tool management
│   │   ├── categories/             # Category management
│   │   ├── tasks/                  # Task management
│   │   ├── tags/                   # Tag management
│   │   ├── settings/               # Site settings
│   │   └── notes/                  # Admin notes
│   │
│   ├── api/                        # API Routes
│   │   ├── public/                 # Public APIs (rate limited)
│   │   │   ├── tools/              # Tool listing & detail
│   │   │   ├── search/             # Public search
│   │   │   └── categories/         # Category data
│   │   ├── tools/                  # Protected tool CRUD
│   │   ├── categories/             # Protected category CRUD
│   │   ├── tasks/                  # Protected task CRUD
│   │   ├── tags/                   # Protected tag CRUD
│   │   ├── upload/                 # Media upload (images/videos)
│   │   ├── analytics/              # Analytics tracking
│   │   ├── vote/                   # Tool voting
│   │   ├── submit-tool/            # Public tool submission
│   │   ├── contact/                # Contact form
│   │   └── settings/               # Site settings
│   │
│   ├── submit/                     # Public tool submission page
│   ├── contact/                    # Contact page
│   ├── go/[slug]/                  # Affiliate redirect
│   ├── login/                      # Hidden admin login
│   ├── about/                      # About page
│   ├── privacy/                    # Privacy policy
│   ├── terms/                      # Terms of service
│   ├── new/                        # New tools page
│   │
│   ├── sitemap.ts                  # Dynamic sitemap (10k+ pages)
│   ├── robots.ts                   # robots.txt
│   ├── not-found.tsx               # 404 page
│   └── global-error.tsx            # Error boundary
│
├── components/
│   ├── features/
│   │   ├── admin/                  # Dashboard components
│   │   │   ├── ToolForm.tsx        # Multi-step tool form
│   │   │   └── ToolTable.tsx       # Tool management table
│   │   └── tools/
│   │       ├── ToolCard.tsx        # Tool card component
│   │       └── ToolGrid.tsx        # Tool grid layout
│   ├── layout/
│   │   ├── Header.tsx              # Main header with search
│   │   ├── Footer.tsx              # Site footer
│   │   ├── Sidebar.tsx             # Desktop sidebar
│   │   ├── MobileNav.tsx           # Mobile bottom navigation
│   │   └── TopHeader.tsx           # Announcement bar
│   ├── ui/                         # Reusable UI components
│   │   ├── SearchSuggestionsDropdown.tsx  # Shared search dropdown
│   │   ├── SearchableSelect.tsx    # Searchable dropdown
│   │   ├── RichTextEditor.tsx      # WYSIWYG editor
│   │   ├── MediaUpload.tsx         # Image/video upload
│   │   ├── ShareModal.tsx          # Social sharing modal
│   │   ├── VoteButtons.tsx         # Upvote/downvote
│   │   ├── Toast.tsx               # Toast notifications
│   │   ├── ConfirmModal.tsx        # Confirmation dialogs
│   │   ├── Combobox.tsx            # Autocomplete input
│   │   ├── ListEditor.tsx          # Dynamic list editor
│   │   ├── Skeleton.tsx            # Loading skeletons
│   │   └── SafeHtml.tsx            # XSS-safe HTML renderer
│   ├── providers/
│   │   └── PostHogProvider.tsx     # Analytics provider
│   ├── Providers.tsx               # Combined providers
│   └── ConditionalClerkProvider.tsx # Clerk SSR wrapper
│
├── context/
│   ├── AdminContext.tsx            # Admin data management
│   ├── SearchContext.tsx           # Global search state
│   ├── SidebarContext.tsx          # Sidebar pin state
│   └── ThemeContext.tsx            # Dark/light/system theme
│
├── hooks/
│   ├── useToolAnalytics.ts         # GA4 analytics tracking
│   ├── usePostHogAnalytics.ts      # PostHog tracking
│   ├── useTypingPlaceholder.ts     # Animated placeholder
│   └── useDebounce.ts              # Debounce hook
│
├── lib/                            # Utilities & Data Layer
│   ├── supabase.ts                 # Supabase client & mapping
│   ├── supabase/                   # Supabase helpers
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── admin.ts                # Service role client
│   ├── data.ts                     # Re-exports from data/
│   ├── data/                       # Modular data layer
│   │   ├── index.ts                # Central exports
│   │   ├── counts.ts               # Count queries
│   │   ├── categories.ts           # Category/Task queries
│   │   ├── tools.ts                # Tool fetching
│   │   ├── related.ts              # Related/suggested tools
│   │   └── search.ts               # Search with scoring
│   ├── actions.ts                  # Server Actions (hidden APIs)
│   ├── search.ts                   # Legacy fuzzy search
│   ├── validations.ts              # Zod schemas
│   ├── rate-limit.ts               # API rate limiting
│   ├── formatters.ts               # Data formatters
│   ├── url.ts                      # URL utilities
│   ├── url-utils.ts                # Additional URL helpers
│   ├── utils.ts                    # General utilities
│   └── auth-utils.ts               # Auth helpers
│
├── services/
│   └── storage.service.ts          # R2 storage service
│
├── types/
│   ├── index.ts                    # TypeScript types
│   └── css.d.ts                    # CSS module types
│
├── styles/
│   └── globals.css                 # CSS variables & global styles
│
├── proxy.ts                        # Security middleware
└── middleware.ts                   # Next.js middleware entry
```

---

## 🔍 Search System

### Features
- **Search-on-Enter**: Full search triggers only on Enter key
- **Live Suggestions**: 6 suggestions while typing (2+ chars)
- **Arrow Key Navigation**: ↑↓ to navigate, Enter to select
- **Pricing Detection**: "free video editing" → filters Free pricing
- **Relevance Scoring**: Name > Summary > Category > Tags
- **Total Count**: Real database count (e.g., "Found 1,172 results")
- **Load More**: Paginated with "Load More" button

### Server Actions (Hidden from Network Tab)
```typescript
// src/lib/actions.ts
searchToolsAction(params)           // Search with filters
searchWithCountAction(params)       // Search + total count
searchCountAction(params)           // Count only
getSearchSuggestionsAction(query)   // Quick suggestions
```

### Data Layer Modules (`src/lib/data/`)
| Module | Functions |
|--------|-----------|
| `counts.ts` | `getToolsCount`, `getCategoriesCount`, `getTasksCount`, `getTagsCount`, `getToolsCountByCategory`, `getToolsCountByTask` |
| `categories.ts` | `getCategories`, `getTasks`, `getTags` |
| `tools.ts` | `getPublishedTools`, `getSpotlightTools`, `getTrendingTools`, `getToolsByCategory`, `getToolsByTask`, `getToolBySlug`, `getHomeSettings`, `getFeaturedTools`, `getRecentlyAddedTools` |
| `related.ts` | `getRelatedTools`, `getSuggestedTools` |
| `search.ts` | `searchTools`, `searchToolsCount` |

---

## 🔐 Security (proxy.ts)

### Hidden Admin Login Flow
1. Admin visits `/login/[SECRET]` (secret URL)
2. Secret validated → `admin_access` cookie set (1 hour)
3. Redirect to `/login` → Clerk sign-in form shown
4. Invalid secret → Silent redirect to homepage

### API Protection
- **Public APIs**: Blocked for direct browser/CLI access
- **Protected APIs**: Require Clerk authentication
- **Rate Limiting**: Per-IP limits on public endpoints

### Environment Variable
```env
ADMIN_LOGIN_SECRET=your-secret-string
```

---

## 🎨 Design System

### CSS Variables (Light/Dark Mode)
```css
/* Light Mode */
--bg-primary: #ffffff
--bg-secondary: #f5f5f5
--bg-card: #ffffff
--text-primary: #171717
--text-secondary: #525252
--accent-primary: #34b27b

/* Dark Mode */
--bg-primary: #191a1a
--bg-secondary: #202222
--bg-card: #232525
--text-primary: #ececec
```

### UI Components
| Component | Purpose |
|-----------|---------|
| `SearchSuggestionsDropdown` | Shared search dropdown (Hero + Search page) |
| `RichTextEditor` | WYSIWYG with formatting toolbar |
| `MediaUpload` | Drag-drop image/video upload with compression |
| `ShareModal` | Social sharing with copy link |
| `VoteButtons` | Upvote/downvote with localStorage tracking |
| `Toast` | Stackable notifications |
| `Combobox` | Autocomplete with keyboard navigation |

---

## 📊 Analytics

| Service | Purpose |
|---------|---------|
| Google Analytics 4 | Traffic & events |
| Google Tag Manager | Tag management |
| Microsoft Clarity | Session recordings & heatmaps |
| PostHog | Product analytics (optional) |

---

## 🗄️ Database Schema (Supabase)

### Table: `tools` (Main Table - 50+ columns)

**Basic Info:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Tool name |
| `app_username` | text | URL slug (unique) |
| `summary` | text | Short description |
| `description` | text | Full HTML description |
| `website_url` | text | Main website URL |
| `affiliate_url` | text | Affiliate link |
| `affiliate_enabled` | boolean | Use affiliate URL |

**Classification:**
| Column | Type | Description |
|--------|------|-------------|
| `category_name` | text[] | Categories array |
| `task_name` | text[] | Tasks array |
| `tags` | text[] | Tags array |

**Pricing:**
| Column | Type | Description |
|--------|------|-------------|
| `pricing` | text | 'Free' / 'Freemium' / 'Paid' |
| `pricing_label` | text | e.g., "From $20/mo" |
| `pricing_tiers` | jsonb | Pricing plans array |
| `has_free_trial` | boolean | Free trial available |
| `free_trial_days` | integer | Trial duration |
| `discount` | text | Current offers |
| `billing_frequency` | text | monthly/yearly/one-time |

**Content:**
| Column | Type | Description |
|--------|------|-------------|
| `core_features` | text[] | Feature list |
| `use_cases` | text[] | Use case list |
| `pros` | text[] | Pros list |
| `cons` | text[] | Cons list |
| `faq` | jsonb | FAQ array [{question, answer}] |

**Media:**
| Column | Type | Description |
|--------|------|-------------|
| `logo_url` | text | Logo path |
| `images` | text[] | Screenshot paths |
| `videos` | text[] | Video paths |

**Engagement:**
| Column | Type | Description |
|--------|------|-------------|
| `save_count` | integer | Bookmark count |
| `view_count` | integer | View count |
| `upvotes` | integer | Upvote count |
| `downvotes` | integer | Downvote count |

**Contact & Social:**
| Column | Type | Description |
|--------|------|-------------|
| `contact_name` | text | Contact person |
| `contact_email` | text | Contact email |
| `contact_company` | text | Company name |
| `contact_mobile` | text | Phone number |
| `social_links` | jsonb | {instagram, facebook, twitter, linkedin, discord, youtube, tiktok} |
| `play_store_url` | text | Android app link |
| `app_store_url` | text | iOS app link |

**Display & Status:**
| Column | Type | Description |
|--------|------|-------------|
| `status` | text | draft/pending/published/approved/scheduled |
| `spotlight_enabled` | boolean | Featured flag |
| `spotlight_position` | integer | Spotlight order |
| `trending_position` | integer | Trending order (0 = not trending) |
| `premium` | boolean | Premium listing (dofollow backlinks) |
| `released_at` | date | Founded date |
| `scheduled_at` | timestamp | Scheduled publish date |
| `created_at` | timestamp | Record created |
| `updated_at` | timestamp | Last modified |

**Admin:**
| Column | Type | Description |
|--------|------|-------------|
| `internal_notes` | jsonb | Admin notes [{note, createdAt}] |
| `alternative_tools` | text[] | Related tool slugs |
| `version_history` | jsonb | Version changelog |

---

### Table: `categories`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `category_name` | text | Category name (unique) |
| `description` | text | Category description |
| `icon` | text | Icon/emoji |
| `count` | integer | Tool count |
| `created_at` | timestamp | Record created |

### Table: `tasks`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `task_name` | text | Task name (unique) |
| `description` | text | Task description |
| `icon` | text | Icon/emoji |
| `count` | integer | Tool count |
| `created_at` | timestamp | Record created |

### Table: `tags`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tag_name` | text | Tag name (unique) |
| `description` | text | Tag description |
| `count` | integer | Tool count |

### Table: `settings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `spotlight_count` | integer | Spotlight items count |
| `show_spotlight_on_home` | boolean | Show spotlight section |
| `show_categories_on_home` | boolean | Show categories section |
| `show_tasks_on_home` | boolean | Show tasks section |
| `show_top10_on_home` | boolean | Show top 10 section |
| `show_featured_alternatives` | boolean | Show alternatives |

### Table: `notes`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Note title |
| `content` | text | Note content |
| `tool_id` | uuid | Associated tool (optional) |
| `created_at` | timestamp | Record created |
| `updated_at` | timestamp | Last modified |

### Table: `contacts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Sender name |
| `email` | text | Sender email |
| `subject` | text | Message subject |
| `message` | text | Message content |
| `created_at` | timestamp | Submission date |

### Table: `submissions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tool_name` | text | Submitted tool name |
| `website_url` | text | Tool website |
| `description` | text | Tool description |
| `submitter_email` | text | Submitter email |
| `status` | text | pending/approved/rejected |
| `created_at` | timestamp | Submission date |

### Key Fields Mapping (snake_case → camelCase)
```
app_username → slug
category_name → categoryName
task_name → taskName
website_url → websiteUrl
logo_url → logoUrl
released_at → releasedAt
save_count → saveCount
pricing_tiers → pricingTiers
```

---

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Cloudflare R2 Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=aibde-webapp-prod
R2_DEV_URL=https://pub-xxx.r2.dev
NEXT_PUBLIC_CDN_URL=https://cdn.aibde.tech

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://e.aibde.tech
POSTHOG_PERSONAL_API_KEY=phx_xxx
POSTHOG_PROJECT_ID=xxx

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# Cloudflare Turnstile (CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4xxx
TURNSTILE_SECRET_KEY=0x4xxx

# Google Apps Script Integrations
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
GOOGLE_APPS_SCRIPT_TOOL_SUBMISSIONS_URL=https://script.google.com/macros/s/xxx/exec

# Admin Configuration
ADMIN_LOGIN_SECRET=your-secret-string
```

---

## 🚀 Commands

```bash
npm run dev      # Development (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

### Clear Cache
```bash
# Windows
Remove-Item -Path .next -Recurse -Force; npm run dev

# macOS/Linux
rm -rf .next && npm run dev
```

---

## 📞 Contact

- **Website:** https://www.aibde.tech
- **Email:** support@aibde.tech
