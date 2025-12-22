import { Metadata } from 'next';

export default function Sitemap() {
  return [
    {
      url: 'https://dtf-wholesale.ca',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dtf-wholesale.ca/nesting-tool',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://dtf-wholesale.ca/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://dtf-wholesale.ca/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
