import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        club: {
          50: '#f5f6ff',
          100: '#eceeff',
          200: '#d9ddff',
          300: '#b8c0ff',
          400: '#8e96ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#151724',
          850: '#11131d',
          900: '#0c0d15',
          950: '#06070b',
        },
        drop: {
          pink: '#ec4899',
          purple: '#a855f7',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
