import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,

    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2sup.ts')
      ],
      name: 'aribb24js',
      fileName: '[format]/[name]',
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      external: ['@napi-rs/canvas', 'node:fs'],
      output: {
        preserveModules: true,
        exports: 'named',
      },
    },
  },
})
