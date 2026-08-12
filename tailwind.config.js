/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/partials/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgDark: '#020202',
        surfaceDark: '#0a0614',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)',
        accent: '#8B5CF6',      // Purple Brand Accent
        accentGlow: '#A855F7',  // Vibrant Purple Glow
        accentDark: '#7C3AED',  // Deep Purple
        textMuted: '#9CA3AF',
        adminBgDark: '#05030a',
        adminSurfaceDark: '#0b0717',
        adminSurfaceCard: '#130d25',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beam': 'beamFlow 2s linear infinite',
        'float': 'floatAnim 6s ease-in-out infinite',
      },
      keyframes: {
        beamFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        floatAnim: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        }
      }
    },
  },
  plugins: [],
}
