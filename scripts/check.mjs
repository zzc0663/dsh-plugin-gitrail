/**
 * Manifest and packaging checks that do not need a browser.
 *
 * Run with `npm run check` after the syntax checks.
 */

import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const problems = []

function check(condition, message) {
  if (!condition) problems.push(message)
}

async function exists(relative) {
  try {
    await access(join(root, relative))
    return true
  } catch {
    return false
  }
}

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const client = await readFile(join(root, 'client.js'), 'utf8')
const icon = await readFile(join(root, 'icon.svg'), 'utf8')

check(pkg.name === 'dsh-plugin-gitrail', 'package name must be dsh-plugin-gitrail')
check(pkg.type === 'module', 'package must be an ES module')
check(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch must point at cordis.patch.yml')
check(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform must be web')
check(Array.isArray(pkg.dsh?.client?.inject), 'dsh.client.inject must be an array')
check(pkg.exports?.['./client'] === './client.js', 'exports["./client"] must expose client.js')
check(pkg.exports?.['./icon'] === './icon.svg', 'exports["./icon"] must expose icon.svg')
check(pkg.exports?.['./locale/*.json'] === './locale/*.json', 'exports must expose locale JSON')
check(
  Array.isArray(pkg.files) && ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg'].every((file) => pkg.files.includes(file)),
  'files must include the runtime entries',
)

for (const file of ['index.js', 'client.js', 'lib/git.js', 'cordis.patch.yml', 'icon.svg', 'locale/en.json', 'locale/zh.json']) {
  check(await exists(file), `${file} must exist`)
}

check(client.includes("id: 'dsh-plugin-gitrail'"), 'client module id must equal the package name')
check(client.includes('window.__ModuleLoader__.load'), 'client must use the __ModuleLoader__ format')
check(!/\bimport\s+.*\bfrom\b/.test(client), 'client.js must not use import statements')
check(!/<[A-Z][A-Za-z]*\s/.test(client), 'client.js must not contain JSX')
check(icon.trimStart().startsWith('<svg'), 'icon.svg must be an SVG document')

for (const locale of ['en', 'zh']) {
  const text = await readFile(join(root, `locale/${locale}.json`), 'utf8')
  let data
  try {
    data = JSON.parse(text)
  } catch {
    problems.push(`locale/${locale}.json must be valid JSON`)
    continue
  }
  check(typeof data.meta?.title === 'string' && data.meta.title !== '', `locale/${locale}.json needs meta.title`)
  check(typeof data.meta?.description === 'string' && data.meta.description !== '', `locale/${locale}.json needs meta.description`)
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`check: ${problem}`)
  process.exit(1)
}

console.log('check: manifest, client format, locales and icon are consistent')
