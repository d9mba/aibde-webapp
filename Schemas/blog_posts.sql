-- Schema for blog_posts

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text NOT NULL, -- MDX content
    excerpt text,
    category text,
    tags text[],
    related_tools text[], -- Array of tool app_usernames
    faq jsonb, -- Array of { question, answer }
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    author_id uuid, -- Reference to admin user if needed
    meta_title text,
    meta_description text,
    focus_keywords text[],
    cover_image text, -- Hero/thumbnail image path
    images text[] -- Inline content images
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' SET search_path = '';

CREATE TRIGGER update_blog_posts_modtime
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public read for published posts
CREATE POLICY "Public can read published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- Admins manage all posts (assume authenticated means admin for this app, or refine based on your roles)
CREATE POLICY "Admins manage blog posts"
ON public.blog_posts
USING (auth.role() = 'authenticated');
