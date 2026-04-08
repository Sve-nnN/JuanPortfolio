import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/int/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      // Temporarily exclude tests with SCSS import issues
      'tests/int/frontend/page.int.test.tsx',
      'tests/unit/blocks/Content.test.tsx',
      'tests/unit/blocks/HeroHome.test.tsx',
      'tests/unit/components/RichText.test.tsx',
    ],
    globals: true,
    environment: 'jsdom',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
