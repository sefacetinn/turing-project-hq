import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#141414',
          border: '#262626',
          hover: '#1f1f1f',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};

export default config;
