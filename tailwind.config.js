/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── PALETA OFICIAL DE COLORES GLORYPOS ──
        glory: {
          orange: '#FF6B35', // Color Principal (Apetito y Energía)
          dark: '#1E2022',   // Azul Nocturno (Confianza y Estructuras)
          yellow: '#FFB627', // Amarillo Mostaza (Énfasis y Detalle)
          cream: '#FDFBF7',  // Crema Natural (Fondo y Calidez)
          green: '#00B574',  // Verde Éxito (Conversión y Transacciones)
        },
        primary: {
          DEFAULT: '#FF6B35',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B35',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          DEFAULT: '#1E2022',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#1E2022',
        },
        accent: {
          DEFAULT: '#FFB627',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#FFB627',
          600: '#f59e0b',
          700: '#d97706',
        },
        glorypos: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#FF6B35',
          600: '#ea580c',
          700: '#c2410c',
          dark: '#1E2022',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#00B574',
          600: '#009c63',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        // Guía de marca: Poppins para títulos/logo, Nunito para textos y botones
        display: ['Poppins', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        brand: ['Nunito', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
