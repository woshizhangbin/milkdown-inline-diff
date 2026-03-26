import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MilkdownInlineDiff',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['@milkdown/ctx', '@milkdown/prose'],
      output: {
        globals: {
          '@milkdown/ctx': 'MilkdownCtx',
          '@milkdown/prose': 'MilkdownProse',
        },
      },
    },
  },
})
