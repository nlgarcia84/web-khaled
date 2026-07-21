// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sanity({
      projectId: '6flkjd1o',
      dataset: 'production',
      useCdn: true,
      studioBasePath: '/admin',
    }),
  ],
});