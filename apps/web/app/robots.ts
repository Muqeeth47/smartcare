import type { MetadataRoute } from 'next';

// Crawlers that collect pages to train AI models or build copies of sites
const DATA_COLLECTORS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'PerplexityBot',
  'Bytespider',
  'Amazonbot',
  'cohere-ai',
  'Applebot-Extended',
  'FacebookBot',
  'Diffbot',
  'ImagesiftBot',
  'Omgilibot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/login', '/api/'] },
      { userAgent: DATA_COLLECTORS, disallow: '/' },
    ],
  };
}
