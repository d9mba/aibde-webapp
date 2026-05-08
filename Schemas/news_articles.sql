-- Schema for news_articles

CREATE TABLE public.news_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    summary text,
    content text NOT NULL, -- Full HTML/MD content
    category text DEFAULT 'all',
    thumbnail text,
    sources jsonb DEFAULT '[]'::jsonb, -- Array of { name, url, favicon }
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    read_time_minutes smallint DEFAULT 1,
    related_tool_slugs text[] DEFAULT '{}'::text[],
    tags text[] DEFAULT '{}'::text[],
    hero_image text,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for fast feed queries
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_slug ON public.news_articles(slug);

-- Re-use existing update_modified_column trigger if it exists from blog_posts,
-- otherwise create it (it was created in blog_posts.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        CREATE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$ language 'plpgsql' SET search_path = '';
    END IF;
END
$$;

CREATE TRIGGER update_news_articles_modtime
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all news articles
CREATE POLICY "Public can read news articles"
ON public.news_articles FOR SELECT
USING (true);

-- Admins manage all news articles
CREATE POLICY "Admins manage news articles"
ON public.news_articles
USING (auth.role() = 'authenticated');
