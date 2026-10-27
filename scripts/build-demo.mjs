// Builds the reports prototype into ONE self-contained HTML file
// (dist-demo/HealthKernel-Reports-Demo.html) that opens directly from disk.
import { build } from 'vite'
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const out = 'dist-demo'
await build({ configFile: 'vite.config.ts', base: './', build: { outDir: out, emptyOutDir: true, rollupOptions: { input: 'demo.html' } }, logLevel: 'warn' })

let html = readFileSync(join(out, 'demo.html'), 'utf8')
const assets = join(out, 'assets')
for (const f of readdirSync(assets)) {
  const code = readFileSync(join(assets, f), 'utf8')
  if (f.endsWith('.css')) {
    html = html.replace(new RegExp(`<link rel="stylesheet"[^>]*${f}">`), () => `<style>${code}</style>`)
  } else if (f.endsWith('.js')) {
    html = html.replace(new RegExp(`<script type="module" crossorigin src="./assets/${f}"></script>`), '')
    html = html.replace('</body>', () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>\n</body>`)
  }
}
rmSync(assets, { recursive: true })
rmSync(join(out, 'demo.html'))
writeFileSync(join(out, 'HealthKernel-Reports-Demo.html'), html)
console.log(`Built ${out}/HealthKernel-Reports-Demo.html (${(html.length / 1024).toFixed(0)} KB)`)
