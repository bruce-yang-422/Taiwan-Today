import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './privacy.html', './docs/site/*.js'],
  // Preserve the site's existing typography and native form controls.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: { ink: '#153b58', paper: '#fffefa', line: '#dce3e5' },
    },
  },
  plugins: [],
} satisfies Config;
