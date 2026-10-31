/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#070b14',
          850: '#0c1222',
          800: '#11192e',
          700: '#1a243e',
          600: '#263457',
        },
        forge: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          purple: '#a855f7',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
    },
  },
  plugins: [],
}

