import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        beige: '#EBEBEB',
        terracotta: '#F07A22',
        charcoal: '#2E2E2E',
        navy: '#1E3777',
        offwhite: '#FAFAFA',
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
