/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'saban-dark': '#0B141A',
        'saban-emerald': '#00A884',
        'saban-blue': '#3B82F6',
        'saban-slate': '#0F172A',
        'saban-surface': '#1E293B',
        'saban-muted': '#94A3B8',
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      backgroundColor: {
        'glass': 'rgba(11, 20, 26, 0.5)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
