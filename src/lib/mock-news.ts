/**
 * Mock news data — served via /api/news routes.
 * Will be replaced by Supabase queries once the ingestion pipeline is built.
 */

import type { NewsArticle } from '@/types/news';
import { calculateReadTime } from '@/lib/news-utils';

const now = new Date();
function hoursAgo(h: number): string {
    return new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
}
function daysAgo(d: number): string {
    return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** Auto-calculates readTimeMinutes from content */
function article(data: Omit<NewsArticle, 'readTimeMinutes'>): NewsArticle {
    return { ...data, readTimeMinutes: calculateReadTime(data.content) };
}

export const MOCK_NEWS: NewsArticle[] = [
    article({
        id: '1',
        title: 'OpenAI Launches GPT-5 With Native Multimodal Reasoning',
        slug: 'openai-launches-gpt-5-multimodal-reasoning',
        summary: 'OpenAI has officially unveiled GPT-5, featuring native multimodal reasoning across text, images, audio, and video. The model demonstrates significant improvements in long-context understanding and code generation.',
        content: `<p>OpenAI has officially unveiled GPT-5, its most advanced large language model to date. The model features native multimodal reasoning across text, images, audio, and video inputs — a significant leap from GPT-4o's capabilities.</p>
<h2>Key Improvements</h2>
<p>GPT-5 introduces several groundbreaking features:</p>
<ul>
<li><strong>Native multimodal reasoning</strong> — seamlessly processes and reasons across text, images, audio, and video in a single context window</li>
<li><strong>Extended context</strong> — supports up to 1M token context with near-perfect recall</li>
<li><strong>Improved code generation</strong> — achieves 92% on SWE-Bench, up from GPT-4o's 64%</li>
<li><strong>Faster inference</strong> — 2.5x faster than GPT-4o at equivalent quality</li>
</ul>
<h2>Pricing & Availability</h2>
<p>GPT-5 is available immediately through the API at $15/M input tokens and $60/M output tokens. ChatGPT Plus subscribers get access starting today, while free-tier users will gain access over the next two weeks.</p>
<h2>Industry Impact</h2>
<p>The release positions OpenAI firmly ahead in the competitive AI landscape, particularly against Anthropic's Claude 4 and Google's Gemini Ultra. Analysts expect this to accelerate enterprise AI adoption significantly.</p>`,
        category: 'models',
        thumbnail: null,
        sources: [
            { name: 'OpenAI', url: 'https://openai.com/blog/gpt-5', favicon: 'https://www.google.com/s2/favicons?domain=openai.com&sz=32' },
            { name: 'TechCrunch', url: 'https://techcrunch.com/gpt-5-launch', favicon: 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=32' },
            { name: 'The Verge', url: 'https://theverge.com/gpt-5', favicon: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=32' },
            { name: 'Wired', url: 'https://wired.com/gpt-5-launch', favicon: 'https://www.google.com/s2/favicons?domain=wired.com&sz=32' },
            { name: 'Ars Technica', url: 'https://arstechnica.com/gpt-5', favicon: 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=32' },
        ],
        publishedAt: hoursAgo(2),
        relatedToolSlugs: ['chatgpt', 'openai-api'],
        tags: ['GPT-5', 'OpenAI', 'LLM', 'Multimodal'],
        heroImage: null,
        isFeatured: true,
    }),
    article({
        id: '2',
        title: 'Anthropic Raises $5B Series E at $61B Valuation',
        slug: 'anthropic-raises-5b-series-e',
        summary: 'Anthropic has closed a $5 billion Series E funding round led by Lightspeed Venture Partners, bringing its valuation to $61 billion. The funds will accelerate Claude model development and enterprise expansion.',
        content: `<p>Anthropic, the AI safety company behind the Claude model family, has closed a massive $5 billion Series E funding round. The round was led by Lightspeed Venture Partners with participation from Google, Spark Capital, and several sovereign wealth funds.</p>
<h2>Valuation & Strategy</h2>
<p>The round values Anthropic at $61 billion, making it one of the most valuable private AI companies globally. CEO Dario Amodei stated the funds will be directed toward three priorities:</p>
<ul>
<li>Next-generation Claude model development</li>
<li>Enterprise infrastructure scaling</li>
<li>AI safety research expansion</li>
</ul>
<h2>Market Position</h2>
<p>Anthropic continues to gain enterprise traction with Claude, particularly in regulated industries like healthcare and finance where its Constitutional AI approach offers compliance advantages.</p>`,
        category: 'funding',
        thumbnail: null,
        sources: [
            { name: 'Bloomberg', url: 'https://bloomberg.com/anthropic-funding', favicon: 'https://www.google.com/s2/favicons?domain=bloomberg.com&sz=32' },
            { name: 'Reuters', url: 'https://reuters.com/anthropic-series-e', favicon: 'https://www.google.com/s2/favicons?domain=reuters.com&sz=32' },
        ],
        publishedAt: hoursAgo(5),
        relatedToolSlugs: ['claude'],
        tags: ['Anthropic', 'Funding', 'Claude', 'Series E'],
        heroImage: null,
        isFeatured: true,
    }),
    article({
        id: '3',
        title: 'Meta Open-Sources Llama 4 with MoE Architecture',
        slug: 'meta-open-sources-llama-4-moe',
        summary: 'Meta has released Llama 4, its latest open-source LLM featuring a Mixture of Experts architecture. The model achieves GPT-4 class performance while running efficiently on consumer hardware.',
        content: `<p>Meta has released Llama 4, the latest in its open-source large language model series. The standout feature is its Mixture of Experts (MoE) architecture, which allows the model to match GPT-4 class performance while using significantly less compute per inference.</p>
<h2>Architecture Details</h2>
<p>Llama 4 uses a 16-expert MoE design where only 2 experts are activated per token, resulting in effective parameter usage of ~30B while having access to 400B total parameters.</p>
<h2>Performance Benchmarks</h2>
<p>On standard benchmarks, Llama 4 achieves competitive results against proprietary models while being fully open-source under the Llama Community License.</p>`,
        category: 'open-source',
        thumbnail: null,
        sources: [
            { name: 'Meta AI', url: 'https://ai.meta.com/llama-4', favicon: 'https://www.google.com/s2/favicons?domain=meta.com&sz=32' },
            { name: 'Hugging Face', url: 'https://huggingface.co/meta-llama', favicon: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=32' },
            { name: 'Ars Technica', url: 'https://arstechnica.com/llama-4', favicon: 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=32' },
        ],
        publishedAt: hoursAgo(8),
        relatedToolSlugs: ['meta-ai'],
        tags: ['Llama 4', 'Open Source', 'Meta', 'MoE'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '4',
        title: 'Google DeepMind Publishes Breakthrough in Protein-Drug Interaction Prediction',
        slug: 'deepmind-protein-drug-interaction-breakthrough',
        summary: 'Google DeepMind researchers have published a new method for predicting protein-drug interactions with 95% accuracy, potentially accelerating drug discovery timelines by years.',
        content: `<p>Google DeepMind has announced a major breakthrough in computational biology with a new model that predicts protein-drug interactions with unprecedented accuracy.</p>
<h2>Methodology</h2>
<p>The new approach builds on AlphaFold's protein structure predictions and combines them with a novel molecular dynamics simulation framework. The resulting system achieves 95% accuracy on standard drug-protein binding benchmarks.</p>
<h2>Impact on Drug Discovery</h2>
<p>Pharmaceutical companies have already expressed interest. The technology could reduce the early-stage drug discovery process from years to months, potentially saving billions in R&D costs and bringing life-saving treatments to patients faster.</p>`,
        category: 'research',
        thumbnail: null,
        sources: [
            { name: 'Nature', url: 'https://nature.com/deepmind-drug', favicon: 'https://www.google.com/s2/favicons?domain=nature.com&sz=32' },
            { name: 'Google DeepMind', url: 'https://deepmind.google/research', favicon: 'https://www.google.com/s2/favicons?domain=deepmind.google&sz=32' },
        ],
        publishedAt: hoursAgo(14),
        relatedToolSlugs: ['gemini'],
        tags: ['DeepMind', 'Research', 'Drug Discovery', 'AlphaFold'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '5',
        title: 'Runway Launches Gen-4: Real-Time Video Generation at 4K',
        slug: 'runway-gen-4-realtime-video-generation',
        summary: 'Runway has launched Gen-4, capable of generating 4K video in real-time. The tool supports multi-shot consistency and precise camera controls, setting new standards for AI video.',
        content: `<p>Runway has officially launched Gen-4, its next-generation AI video creation tool. The headline feature is real-time 4K video generation with unprecedented control over camera movements, lighting, and subject consistency.</p>
<h2>Key Features</h2>
<ul>
<li>Real-time 4K video generation (30fps)</li>
<li>Multi-shot character and scene consistency</li>
<li>Precise camera path controls with keyframing</li>
<li>Audio-synchronized generation</li>
</ul>
<h2>Pricing</h2>
<p>Gen-4 is available through Runway's existing subscription plans, with enhanced compute allocation for Pro and Enterprise users.</p>`,
        category: 'video-ai',
        thumbnail: null,
        sources: [
            { name: 'Runway', url: 'https://runwayml.com/gen-4', favicon: 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=32' },
            { name: 'Wired', url: 'https://wired.com/runway-gen4', favicon: 'https://www.google.com/s2/favicons?domain=wired.com&sz=32' },
        ],
        publishedAt: daysAgo(1),
        relatedToolSlugs: ['runway'],
        tags: ['Runway', 'Video AI', 'Gen-4', '4K'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '6',
        title: 'Cursor AI Crosses 10M Users, Announces Enterprise Tier',
        slug: 'cursor-ai-10m-users-enterprise',
        summary: 'Cursor, the AI-powered code editor, has crossed 10 million users and announced a new Enterprise tier with SOC 2 compliance, SSO, and on-premise deployment options.',
        content: `<p>Cursor AI has announced reaching 10 million users, making it the most widely adopted AI code editor. Alongside this milestone, the company has launched an Enterprise tier.</p>
<h2>Enterprise Features</h2>
<ul>
<li>SOC 2 Type II compliance</li>
<li>SAML SSO integration</li>
<li>On-premise deployment options</li>
<li>Custom model fine-tuning on codebase</li>
<li>Advanced audit logging</li>
</ul>
<h2>Growth Trajectory</h2>
<p>The company has seen 300% year-over-year growth, driven primarily by developer teams transitioning from VS Code. The Enterprise tier is expected to accelerate this growth in regulated industries.</p>`,
        category: 'coding-ai',
        thumbnail: null,
        sources: [
            { name: 'Cursor', url: 'https://cursor.com/blog/enterprise', favicon: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=32' },
            { name: 'VentureBeat', url: 'https://venturebeat.com/cursor-10m', favicon: 'https://www.google.com/s2/favicons?domain=venturebeat.com&sz=32' },
        ],
        publishedAt: daysAgo(1),
        relatedToolSlugs: ['cursor'],
        tags: ['Cursor', 'Code Editor', 'Enterprise', 'AI Coding'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '7',
        title: 'Midjourney V7 Introduces 3D Object Generation',
        slug: 'midjourney-v7-3d-object-generation',
        summary: 'Midjourney V7 now supports full 3D object generation from text prompts, with export to GLB/USDZ formats. The update also brings significant improvements to photorealism.',
        content: `<p>Midjourney has released Version 7, which introduces 3D object generation alongside its renowned image generation capabilities.</p>
<h2>3D Generation</h2>
<p>Users can now generate fully textured 3D objects from text prompts, exportable in GLB and USDZ formats for use in game engines, AR applications, and 3D workflows.</p>
<h2>Photorealism Improvements</h2>
<p>V7 also brings a major upgrade to photorealism, with improved skin textures, lighting accuracy, and material rendering that makes AI-generated images nearly indistinguishable from photographs.</p>`,
        category: 'ai-tools',
        thumbnail: null,
        sources: [
            { name: 'Midjourney', url: 'https://midjourney.com/updates/v7', favicon: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=32' },
            { name: 'The Verge', url: 'https://theverge.com/midjourney-v7', favicon: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=32' },
        ],
        publishedAt: daysAgo(2),
        relatedToolSlugs: ['midjourney'],
        tags: ['Midjourney', '3D', 'Image Generation', 'V7'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '8',
        title: 'Perplexity Launches Sonar Pro API with Citations',
        slug: 'perplexity-sonar-pro-api-citations',
        summary: 'Perplexity has launched Sonar Pro, a new API endpoint that provides real-time web search with inline citations and structured source attribution for enterprise applications.',
        content: `<p>Perplexity AI has launched Sonar Pro, a premium API tier designed for enterprises that need real-time web search capabilities with verifiable citations.</p>
<h2>Features</h2>
<ul>
<li>Real-time web search with inline citations</li>
<li>Structured JSON source attribution</li>
<li>Custom search domains and filters</li>
<li>99.9% uptime SLA</li>
</ul>
<h2>Use Cases</h2>
<p>Early enterprise adopters are using Sonar Pro for customer support automation, research workflows, and content verification systems where citation accuracy is critical.</p>`,
        category: 'ai-tools',
        thumbnail: null,
        sources: [
            { name: 'Perplexity', url: 'https://perplexity.ai/blog/sonar-pro', favicon: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=32' },
        ],
        publishedAt: daysAgo(3),
        relatedToolSlugs: ['perplexity'],
        tags: ['Perplexity', 'API', 'Search', 'Citations'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '9',
        title: 'Stability AI Announces Stable Diffusion 4.0 with Native Video',
        slug: 'stability-ai-stable-diffusion-4-native-video',
        summary: 'Stability AI has released Stable Diffusion 4.0, which unifies image and video generation in a single model architecture. The open-weight model runs on consumer GPUs with 12GB VRAM.',
        content: `<p>Stability AI has released Stable Diffusion 4.0, a unified image and video generation model that represents a fundamental architectural shift.</p>
<h2>Unified Architecture</h2>
<p>SD 4.0 uses a single model for both image and video generation, eliminating the need for separate pipelines. The model runs efficiently on consumer GPUs with 12GB VRAM.</p>
<h2>Open Weights</h2>
<p>True to Stability AI's mission, the model weights are fully open under the Stability Community License, enabling developers and researchers to build upon the technology freely.</p>`,
        category: 'open-source',
        thumbnail: null,
        sources: [
            { name: 'Stability AI', url: 'https://stability.ai/sd4', favicon: 'https://www.google.com/s2/favicons?domain=stability.ai&sz=32' },
            { name: 'Hugging Face', url: 'https://huggingface.co/stability-ai/sd4', favicon: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=32' },
        ],
        publishedAt: daysAgo(4),
        relatedToolSlugs: ['stable-diffusion'],
        tags: ['Stable Diffusion', 'Open Source', 'Video', 'Image Generation'],
        heroImage: null,
        isFeatured: false,
    }),
    article({
        id: '10',
        title: 'Y Combinator S26 Batch: 40% of Startups Are AI-Native',
        slug: 'yc-s26-batch-40-percent-ai-native',
        summary: "Y Combinator's Summer 2026 batch features a record 40% AI-native startups. Key themes include AI agents, vertical SaaS, and developer tooling.",
        content: `<p>Y Combinator's Summer 2026 batch has been announced, with a record 40% of accepted startups being AI-native companies. The cohort includes 280 startups spanning multiple verticals.</p>
<h2>Key Themes</h2>
<ul>
<li><strong>AI Agents</strong> — 35 startups building autonomous agent systems for sales, support, and operations</li>
<li><strong>Vertical SaaS</strong> — AI-powered solutions for specific industries including healthcare, legal, and construction</li>
<li><strong>Developer Tooling</strong> — Next-gen AI development infrastructure for testing, deployment, and monitoring</li>
</ul>
<h2>Notable Companies</h2>
<p>While YC doesn't reveal companies pre-Demo Day, sources indicate several teams are working on breakthrough applications of agentic AI in enterprise workflows.</p>`,
        category: 'startups',
        thumbnail: null,
        sources: [
            { name: 'Y Combinator', url: 'https://ycombinator.com/batch/s26', favicon: 'https://www.google.com/s2/favicons?domain=ycombinator.com&sz=32' },
            { name: 'TechCrunch', url: 'https://techcrunch.com/yc-s26', favicon: 'https://www.google.com/s2/favicons?domain=techcrunch.com&sz=32' },
        ],
        publishedAt: daysAgo(5),
        relatedToolSlugs: [],
        tags: ['Y Combinator', 'Startups', 'AI Agents', 'VC'],
        heroImage: null,
        isFeatured: false,
    }),
];

/** Get all news articles */
export function getMockNews(category?: string): NewsArticle[] {
    if (!category || category === 'all') return MOCK_NEWS;
    return MOCK_NEWS.filter(a => a.category === category);
}

/** Get a single article by slug */
export function getMockNewsBySlug(slug: string): NewsArticle | null {
    return MOCK_NEWS.find(a => a.slug === slug) || null;
}

/** Get related news by category, excluding current article */
export function getMockRelatedNews(slug: string, category: string, limit: number): NewsArticle[] {
    return MOCK_NEWS
        .filter(a => a.slug !== slug && a.category === category)
        .slice(0, limit);
}
