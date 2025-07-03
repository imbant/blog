import { defineConfig } from 'astro/config';
import rss from '@astrojs/rss';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://imbant.github.io',
  base: '/blog',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
});