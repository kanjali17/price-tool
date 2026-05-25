/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        daikin: {
          navy: '#1e3a5f',
          slate: '#2d4a6f',
          accent: '#f59e0b',
          input: '#dbeafe',
          subtotal: '#dcfce7',
        },
      },
    },
  },
  plugins: [],
}
