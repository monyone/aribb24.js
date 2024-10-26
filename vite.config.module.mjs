import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'aribb24js',
      fileName: '[format]/[name]',
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      output: {
        preserveModules: true,
        exports: 'named',
      },
    },
  },
})
