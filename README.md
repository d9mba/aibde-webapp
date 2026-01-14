# AIBDE - AI Tool Directory

A modern, production-ready AI tool directory built with Next.js, Supabase, and Clerk authentication.

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
| **Tailwind CSS** | Utility-first styling |
| **Sharp** | Image optimization (WebP conversion) |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public pages)      # /, /about, /privacy, /terms, /search
│   ├── app/[slug]/         # Tool detail pages
│   ├── category/[slug]/    # Category pages
│   ├── task/[slug]/        # Task pages
│   ├── dashboard/          # Admin dashboard (protected)
│   ├── api/                # API routes
│   ├── sitemap.ts          # Dynamic sitemap generation
│   └── robots.ts           # robots.txt configuration
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── admin/          # Dashboard components (ToolForm, etc.)
│   │   └── tools/          # Tool cards, lists
│   ├── layout/             # Header, Footer, Sidebar, TopHeader
│   └── ui/                 # Reusable UI components
├── context/                # React contexts
│   ├── AdminContext.tsx    # Admin data management
│   ├── SidebarContext.tsx  # Sidebar pin state
│   └── ThemeContext.tsx    # Dark/light/system theme
├── lib/                    # Utilities
│   ├── supabase.ts         # Supabase client & data mapping
│   ├── data.ts             # Server-side data fetching
│   ├── search.ts           # Fuzzy search algorithm
│   └── auth-utils.ts       # Authentication helpers
├── styles/
│   └── globals.css         # CSS variables, theme, global styles
└── middleware.ts           # Clerk authentication middleware
```

---

## 🎨 Design System

### Color Variables (CSS Custom Properties)

#### Light Mode (default)
```css
--bg-primary: #ffffff      /* Main background */
--bg-secondary: #f5f5f5    /* Secondary sections */
--bg-card: #ffffff         /* Card backgrounds */
--text-primary: #171717    /* Main text */
--text-secondary: #525252  /* Secondary text */
--accent-blue: #34b27b     /* Brand green (Supabase) */
```

#### Dark Mode
```css
--bg-primary: #191a1a      /* Dark charcoal background */
--bg-secondary: #202222    /* Slightly lighter */
--bg-card: #232525         /* Card background */
--text-primary: #ececec    /* Light text */
```

### Brand Colors
- **Primary Accent:** `#34b27b` (Supabase Green)
- **Tailwind equivalent:** `emerald-500` (#10b981)

---

## 🔐 Authentication

### Clerk Setup
1. Protected routes: `/dashboard/*`
2. Login routes: `/login/*` (secret login URL)
3. Middleware file: `src/middleware.ts`

### 🔒 Secure Admin Login URL
The admin login is hidden from public. To access:
```
https://www.aibde.tech/login/[YOUR_SECRET]
```

Set in environment variables:
```env
ADMIN_LOGIN_SECRET=your-secret-string-here
```

> **Note:** The `/login` page shows a fake 404. Only `/login/[correct-secret]` shows the Clerk sign-in form.

### Admin Access
- Admin users need `role: "admin"` in Clerk public metadata
- Currently bypassed for development (check `auth-utils.ts`)

---

## 📊 Analytics Integration

All analytics are loaded via `next/script` with `afterInteractive` strategy:

| Service | ID | Purpose |
|---------|-----|---------|
| Google Analytics 4 | `G-HT35EHF7PQ` | Traffic analytics |
| Google Tag Manager | `GTM-MJ4WCNXC` | Tag management |
| Microsoft Clarity | `v19ejk4063` | Session recordings & heatmaps |

Scripts are in `src/app/layout.tsx`.

---

## 🗄️ Database Schema (Supabase)

### Table: `tools` (Main Table)
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Tool name |
| `app_username` | text | URL slug (unique) |
| `summary` | text | Short description |
| `description` | text | Full HTML description |
| `category_name` | text[] | Categories array |
| `task_name` | text[] | Tasks array |
| `tags` | text[] | Tags array |
| `pricing` | text | 'free' / 'freemium' / 'paid' |
| `pricing_label` | text | e.g., "From $20/mo" |
| `website_url` | text | Main website URL |
| `affiliate_url` | text | Affiliate link |
| `affiliate_enabled` | boolean | Use affiliate URL |
| `logo_url` | text | Logo path/URL |
| `images` | text[] | Screenshot paths |
| `videos` | text[] | Video paths |
| `save_count` | integer | Bookmark count |
| `released_at` | date | Founded date |
| `is_featured` | boolean | Featured flag |
| `core_features` | text[] | Feature list |
| `use_cases` | text[] | Use case list |
| `pros` | text[] | Pros list |
| `cons` | text[] | Cons list |
| `faq` | jsonb | FAQ array |
| `pricing_tiers` | jsonb | Pricing plans |
| `has_free_trial` | boolean | Free trial available |
| `free_trial_days` | integer | Trial duration |
| `social_links` | jsonb | Social media URLs |
| `play_store_url` | text | Android app link |
| `app_store_url` | text | iOS app link |
| `contact_name` | text | Contact person |
| `contact_email` | text | Contact email |
| `internal_notes` | jsonb | Admin notes |
| `status` | text | draft/pending/published/unpublished |
| `spotlight_enabled` | boolean | Show in spotlight |
| `spotlight_position` | integer | Display order |
| `created_at` | timestamp | Record created |
| `updated_at` | timestamp | Last modified |

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

### Table: `settings`
| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `spotlight_count` | integer | Spotlight items count |
| `show_spotlight_on_home` | boolean | Show spotlight section |
| `show_categories_on_home` | boolean | Show categories section |
| `show_tasks_on_home` | boolean | Show tasks section |
| `updated_at` | timestamp | Last modified |

### Table: `notes`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `content` | text | Note content |
| `user_id` | text | Creator user ID |
| `created_at` | timestamp | Record created |

### Key Fields Mapping (snake_case → camelCase)
```
app_username → slug
category_name → categoryName
task_name → taskName
website_url → websiteUrl
logo_url → logoUrl
released_at → releasedAt
```

---

## 🖼️ Media Storage (Cloudflare R2)

### Environment Variables
```env
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.aibde.tech
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=aibde
```

### Upload Folders
- `/logos/` - Tool logos (auto-compressed to WebP)
- `/images/` - Screenshots
- `/videos/` - Video files

---

## 🛠️ Key Features

### 1. Tool Management (Dashboard)
- Add/Edit/Delete tools
- Multi-step form with validation
- Live preview while editing
- Media upload with compression
- Change detection (prevents unnecessary saves)

### 2. Search
- Fuzzy search with priority ranking
- Filter by category, task, pricing
- URL parameters support

### 3. SEO
- Dynamic sitemap (`/sitemap.xml`)
- robots.txt (`/robots.txt`)
- Meta tags for all pages

### 4. Theme System
- Light / Dark / System modes
- Persistent via localStorage
- Smooth transitions

### 5. Responsive Design
- Mobile-first approach
- Collapsible sidebar (desktop)
- Bottom navigation (mobile)

---

## 📝 Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# R2 Storage
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.aibde.tech
NEXT_PUBLIC_CDN_URL=https://cdn.aibde.tech
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=aibde

# Site
NEXT_PUBLIC_SITE_URL=https://www.aibde.tech
```

---

## 🚀 Deployment

### Build Commands
```bash
npm run build    # Production build
npm run start    # Start production server
npm run dev      # Development server
```

### Deployment Platforms
- **Vercel** (recommended for Next.js)
- **Cloudflare Pages**
- **Self-hosted** (Node.js server)

---

## 📋 Development Notes

### Adding New Tools
1. Navigate to `/dashboard/tools/new`
2. Fill required fields (name, summary, description, website)
3. Add categories and tasks
4. Upload logo and screenshots
5. Save as Draft or Submit for Review

### Modifying Theme
Edit `src/styles/globals.css`:
- Light mode: `:root { ... }`
- Dark mode: `[data-theme='dark'] { ... }`

### API Routes
- `GET /api/tools` - List all tools (auth required)
- `POST /api/tools` - Create tool (auth required)
- `GET /api/public/tools` - Public tool listing
- `GET /api/public/tools/[id]` - Public tool detail

---

## 🔧 Maintenance

### Clearing Cache
```bash
Remove-Item -Path .next -Recurse -Force
npm run dev
```

### Database Migrations
Run SQL directly in Supabase SQL Editor.

---

## 📞 Contact

- **Website:** https://www.aibde.tech
- **Email:** support@aibde.tech
