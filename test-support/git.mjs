import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

export async function makeRepo() {
  const dir = await mkdtemp(join(tmpdir(), 'gitrail-test-'))
  git(['init', '-b', 'main'], dir)
  git(['config', 'user.name', 'Gitrail Test'], dir)
  git(['config', 'user.email', 'gitrail@example.invalid'], dir)
  git(['config', 'commit.gpgsign', 'false'], dir)
  return dir
}

export async function makePlainDir() {
  return mkdtemp(join(tmpdir(), 'gitrail-plain-'))
}

export async function commit(dir, file, content, message) {
  await writeFile(join(dir, file), content, 'utf8')
  git(['add', file], dir)
  git(['commit', '-m', message], dir)
}
