import { Metadata } from 'next';

export default function Sitemap() {
  return [
    {
      url: 'https://transfernest.ca',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://transfernest.ca/nesting-tool',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://transfernest.ca/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
