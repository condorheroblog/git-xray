import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  platform: 'node',
  dts: {
    entry: 'src/index.ts',
  },
  exports: true,
  publint: true,
  plugins: [
    StaleGuardRecorder(),
  ],
})
