import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'aribb24js',
      fileName: 'aribb24',
      formats: ['es', 'cjs', 'umd'],
    },
  },
})
