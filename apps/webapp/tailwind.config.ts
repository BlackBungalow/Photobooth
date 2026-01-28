import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#ff4d6d',
          700: '#c9184a'
        }
      }
    }
  },
  plugins: []
};

export default config;
