import assert from 'node:assert/strict'
import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'

import { GitError, parseLog, parseRefs, parseStatus, readRepoState } from '../lib/git.js'
import { commit, git, makePlainDir, makeRepo } from '../test-support/git.mjs'

test('parseStatus reads branch, upstream, track and change count', () => {
  const status = parseStatus('## main...origin/main [ahead 2, behind 1]\n M a.txt\n?? b.txt\n')
  assert.equal(status.branch, 'main')
  assert.equal(status.upstream, 'origin/main')
  assert.equal(status.ahead, 2)
  assert.equal(status.behind, 1)
  assert.equal(status.detached, false)
  assert.equal(status.unborn, false)
  assert.equal(status.changes, 2)
})

test('parseStatus understands detached HEAD and unborn branches', () => {
  const detached = parseStatus('## HEAD (no branch)\n')
  assert.equal(detached.detached, true)
  assert.equal(detached.branch, '')

  const unborn = parseStatus('## No commits yet on main\n')
  assert.equal(unborn.unborn, true)
  assert.equal(unborn.branch, 'main')
})

test('parseRefs keeps local and remote branches and skips remote HEAD', () => {
  const nul = '\u0000'
  const text = [
    ['refs/heads/main', 'main', 'abc1234', '*', 'origin/main', '2026-10-20T12:00:00+08:00', 'init'].join(nul),
    ['refs/heads/feature', 'feature', 'def5678', ' ', '', '2026-10-19T12:00:00+08:00', 'feature'].join(nul),
    ['refs/remotes/origin/HEAD', 'origin/HEAD', 'abc1234', ' ', '', '2026-10-20T12:00:00+08:00', 'init'].join(nul),
    ['refs/remotes/origin/main', 'origin/main', 'abc1234', ' ', '', '2026-10-20T12:00:00+08:00', 'init'].join(nul),
    '',
  ].join('\n')

  const refs = parseRefs(text)
  assert.deepEqual(
    refs.locals.map((branch) => branch.name),
    ['main', 'feature'],
  )
  assert.equal(refs.locals[0].current, true)
  assert.deepEqual(
    refs.remotes.map((branch) => branch.name),
    ['origin/main'],
  )
})

test('parseLog splits commits, parents and refs', () => {
  const nul = '\u0000'
  const text = [
    ['aaa', 'aaa1111', 'bbb', 'Ada', 'ada@example.invalid', '2026-10-20T12:00:00+08:00', 'second', 'HEAD -> main, tag: v1'].join(nul),
    '',
  ].join('\n')

  const commits = parseLog(text)
  assert.equal(commits.length, 1)
  assert.deepEqual(commits[0].parents, ['bbb'])
  assert.deepEqual(commits[0].refs, ['HEAD -> main', 'tag: v1'])
  assert.equal(commits[0].subject, 'second')
})

test('readRepoState describes a normal repository', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'README.md', '# demo\n', 'initial commit')
  await commit(dir, 'src.txt', 'one\n', 'add src')

  const state = await readRepoState(dir)

  assert.equal(state.name, basename(dir))
  assert.equal(state.branch, 'main')
  assert.equal(state.detached, false)
  assert.equal(state.unborn, false)
  assert.equal(state.changes, 0)
  assert.equal(state.commits.length, 2)
  assert.equal(state.commits[0].subject, 'add src')
  assert.equal(state.commits[1].subject, 'initial commit')
  assert.ok(state.head.length >= 7)
  assert.ok(state.branches.locals.some((branch) => branch.name === 'main' && branch.current))
})

test('readRepoState reports an unborn repository', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))

  const state = await readRepoState(dir)

  assert.equal(state.unborn, true)
  assert.equal(state.branch, 'main')
  assert.deepEqual(state.commits, [])
  assert.equal(state.head, '')
})

test('readRepoState reports a detached HEAD', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')
  git(['checkout', '--detach', 'HEAD'], dir)

  const state = await readRepoState(dir)

  assert.equal(state.detached, true)
  assert.equal(state.branch, '')
  assert.equal(state.commits.length, 1)
})

test('readRepoState counts working-tree changes and lists extra branches', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')
  git(['branch', 'feature'], dir)
  await writeFile(join(dir, 'b.txt'), 'b\n', 'utf8')

  const state = await readRepoState(dir)

  assert.equal(state.changes, 1)
  assert.deepEqual(
    state.branches.locals.map((branch) => branch.name),
    ['main', 'feature'],
  )
})

test('readRepoState rejects a directory that is not a repository', async (t) => {
  const dir = await makePlainDir()
  t.after(() => rm(dir, { recursive: true, force: true }))

  await assert.rejects(readRepoState(dir), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'git/not-a-repo')
    return true
  })
})

test('readRepoState rejects a missing workspace directory', async () => {
  await assert.rejects(readRepoState(join(tmpdir(), 'gitrail-missing-workspace')), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'repo/no-cwd')
    return true
  })
})
