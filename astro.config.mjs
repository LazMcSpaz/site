// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Used for canonical URLs and sitemap. Update to the production domain at launch.
  site: 'https://morysautoparts.com',
  integrations: [
    sitemap({
      // Keep the staff area out of the sitemap.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
