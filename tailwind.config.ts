import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        beige: '#F5EBDD',
        terracotta: '#E07A5F',
        charcoal: '#2E2E2E',
        offwhite: '#FFFDF8',
        sage: '#E9F5DB'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
}

export default config
