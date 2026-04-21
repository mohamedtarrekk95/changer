/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: '#8b5cf6',
        dark: {
          DEFAULT: '#0f1419',
          50: '#ffffff',
          100: '#151b23',
          200: '#1c2530',
          300: '#0f1419',
          400: '#060b10',
        },
        surface: {
          DEFAULT: '#151b23',
          100: '#151b23',
          200: '#0f1419',
          300: '#0a0f14',
        },
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        border: '#2a3544',
        'border-light': '#344050',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.15)',
        'glow-lg': '0 0 40px rgba(14, 165, 233, 0.2)',
      },
    },
  },
  plugins: [],
};
