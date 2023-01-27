import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  treeshake: true,
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
})
