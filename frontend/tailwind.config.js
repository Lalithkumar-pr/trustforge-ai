/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#F7F8FA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F1F3F6',
          subtle: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E2E6EC',
          strong: '#D5DBE4',
          divider: '#E9EDF2',
        },
        text: {
          primary: '#172033',
          secondary: '#526075',
          muted: '#8490A3',
          disabled: '#AAB2BF',
        },
        primary: {
          DEFAULT: '#3568B8',
          hover: '#28569D',
          light: '#EAF1FC',
          accent: '#285A9E',
        },
        secondary: {
          DEFAULT: '#7865B5',
          light: '#F1EEFA',
        },
        status: {
          success: {
            text: '#16845B',
            bg: '#E8F5EE',
          },
          warning: {
            text: '#A96D12',
            bg: '#FFF4DE',
          },
          error: {
            text: '#C44444',
            bg: '#FCECEC',
          },
          info: {
            text: '#3568B8',
            bg: '#EAF1FC',
          },
        },
      },
    },
  },
  plugins: [],
}
