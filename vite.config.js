import { defineConfig } from 'vite';
import { profile } from './src/config.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const profilePlaceholders = {
  '[MY NAME]': profile.name,
  '[EMAIL]': profile.email,
  '[LINKEDIN_URL]': profile.linkedin,
  '[GITHUB_URL]': profile.github,
  '[LOCATION]': profile.location,
};

export default defineConfig({
  base: './',
  plugins: [{
    name: 'profile-placeholders',
    transformIndexHtml(html) {
      return Object.entries(profilePlaceholders).reduce(
        (output, [placeholder, value]) => output.replaceAll(placeholder, escapeHtml(value)),
        html,
      );
    },
  }],
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'vendor-three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'vendor-motion';
          return undefined;
        },
      },
    },
  },
});
