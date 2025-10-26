import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globalSetup: './tests/vitest.global.setup.ts',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.test.tsx', 'tests/unit/**/*.test.{ts,tsx}'],
    moduleNameMapper: {
      '\\.scss$': 'identity-obj-proxy',
    },
    globals: true,
    environment: 'jsdom',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
