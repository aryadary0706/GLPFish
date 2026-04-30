// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        primary: '#FB7D00',
        'primary-2': '#FFEE1D',

        neutral: '#FFFFFF',

        success: '#0DF26D',
        info: '#0DF26D',
        warning: '#0DF26D',
        error: '#0DF26D',

        // OPTIONAL: kalau kamu punya naming lama (biar gak refactor semua)
        ocean: {
          400: '#FB7D00',
          300: '#FFEE1D',
          200: '#FFEE1D',
        },
        fish: {
          silver: '#FFFFFF',
          reject: '#0DF26D',
        },
      },
    },
  },
}