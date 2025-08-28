import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,

    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2sup.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2vobsub.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2ass.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2b36.ts'),
        resolve(__dirname, 'src/runtime/cli/bin/ts2imsc.ts'),
        resolve(__dirname, 'src/runtime/common/additional-symbols-glyph.ts')
      ],
      name: 'aribb24js',
      fileName: '[format]/[name]',
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      external: ['@napi-rs/canvas', 'node:fs', 'node:fs/promises'],
      output: {
        preserveModules: true,
        exports: 'named',
      },
    },
  },
})
