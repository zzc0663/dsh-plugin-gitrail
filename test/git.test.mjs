import assert from 'node:assert/strict'
import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'

import {
  GitError,
  parseLog,
  parseNumstat,
  parseRefs,
  parseStatus,
  readCommitDetail,
  readRepoState,
} from '../lib/git.js'
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
    ['refs/remotes/origin/HEAD', 'origin', 'abc1234', ' ', '', '2026-10-20T12:00:00+08:00', 'init'].join(nul),
    ['refs/remotes/origin/main', 'origin/main', 'abc1234', ' ', '', '2026-10-20T12:00:00+08:00', 'init'].join(nul),
    '',
  ].join('\n')

  const refs = parseRefs(text)
  assert.deepEqual(
    refs.locals.map((branch) => branch.name),
    ['main', 'feature'],
  )
  assert.equal(refs.locals[0].current, true)
  assert.equal(refs.locals[0].refname, 'refs/heads/main')
  assert.deepEqual(
    refs.remotes.map((branch) => branch.name),
    ['origin/main'],
  )
  assert.equal(refs.remotes[0].refname, 'refs/remotes/origin/main')
})

test('parseLog splits commits, parents and refs', () => {
  const nul = '\u0000'
  const text = [
    ['aaa', 'aaa1111', 'bbb', 'Ada', 'ada@example.invalid', '2026-10-20T12:00:00+08:00', 'second', 'HEAD -> main, origin/HEAD, origin/main, tag: v1'].join(nul),
    '',
  ].join('\n')

  const commits = parseLog(text)
  assert.equal(commits.length, 1)
  assert.deepEqual(commits[0].parents, ['bbb'])
  assert.deepEqual(commits[0].refs, ['HEAD -> main', 'origin/main', 'tag: v1'])
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
  assert.equal(state.selection.scope, 'all')
})

test('readRepoState defaults to all branches and can scope to one branch', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'initial')
  git(['switch', '-c', 'feature'], dir)
  await commit(dir, 'feature.txt', 'feature\n', 'feature work')
  git(['switch', 'main'], dir)
  await commit(dir, 'main.txt', 'main\n', 'main work')

  const all = await readRepoState(dir)
  assert.equal(all.selection.scope, 'all')
  assert.deepEqual(
    all.commits.map((commit) => commit.subject).sort(),
    ['feature work', 'initial', 'main work'],
  )

  const feature = await readRepoState(dir, { scope: 'branch', ref: 'refs/heads/feature' })
  assert.equal(feature.selection.scope, 'branch')
  assert.equal(feature.selection.ref, 'refs/heads/feature')
  assert.deepEqual(
    feature.commits.map((commit) => commit.subject).sort(),
    ['feature work', 'initial'],
  )

  const main = await readRepoState(dir, { scope: 'branch', ref: 'refs/heads/main' })
  assert.deepEqual(
    main.commits.map((commit) => commit.subject).sort(),
    ['initial', 'main work'],
  )
})

test('readRepoState validates scope and ref before running log', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')

  await assert.rejects(readRepoState(dir, { scope: 'nope' }), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'request/bad-scope')
    return true
  })
  await assert.rejects(readRepoState(dir, { scope: 'branch', ref: '--all' }), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'request/bad-ref')
    return true
  })
  await assert.rejects(readRepoState(dir, { scope: 'branch', ref: 'refs/heads/nope' }), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'git/unknown-ref')
    return true
  })
})

test('readRepoState can scope to a remote-tracking branch', async (t) => {
  const dir = await makeRepo()
  const remote = await makePlainDir()
  t.after(() => rm(dir, { recursive: true, force: true }))
  t.after(() => rm(remote, { recursive: true, force: true }))
  git(['init', '--bare', '-b', 'main'], remote)
  await commit(dir, 'a.txt', 'a\n', 'first')
  git(['remote', 'add', 'origin', remote], dir)
  git(['push', '-u', 'origin', 'main'], dir)
  git(['fetch', 'origin'], dir)

  const state = await readRepoState(dir, { scope: 'branch', ref: 'refs/remotes/origin/main' })
  assert.equal(state.selection.ref, 'refs/remotes/origin/main')
  assert.equal(state.commits[0].subject, 'first')
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

test('parseNumstat handles text, binary and rename rows', () => {
  const files = parseNumstat(
    ['12\t3\tsrc/a.ts', '-\t-\tassets/logo.png', '0\t0\told.txt => new.txt', '1\t0\tdir/{a => b}.ts'].join('\n'),
  )

  assert.deepEqual(files[0], {
    path: 'src/a.ts',
    oldPath: null,
    additions: 12,
    deletions: 3,
    binary: false,
  })
  assert.equal(files[1].binary, true)
  assert.equal(files[2].oldPath, 'old.txt')
  assert.equal(files[2].path, 'new.txt')
  assert.equal(files[3].oldPath, 'dir/a.ts')
  assert.equal(files[3].path, 'dir/b.ts')
})

test('readCommitDetail returns metadata, message, files and a patch', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await writeFile(join(dir, 'a.txt'), 'hello\n', 'utf8')
  git(['add', 'a.txt'], dir)
  git(['commit', '-m', 'feat: add a', '-m', 'body line one\nbody line two'], dir)
  const sha = git(['rev-parse', 'HEAD'], dir)

  const detail = await readCommitDetail(dir, sha)

  assert.equal(detail.commit.sha, sha)
  assert.equal(detail.commit.subject, 'feat: add a')
  assert.match(detail.commit.body, /body line one/)
  assert.equal(detail.commit.author.name, 'Gitrail Test')
  assert.equal(detail.commit.committer.name, 'Gitrail Test')
  assert.equal(detail.files.length, 1)
  assert.equal(detail.files[0].path, 'a.txt')
  assert.equal(detail.files[0].additions, 1)
  assert.equal(detail.files[0].binary, false)
  assert.match(detail.patch, /diff --git a\/a.txt b\/a.txt/)
  assert.match(detail.patch, /\+hello/)
})

test('readCommitDetail reports renames and binary files', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'old.txt', 'hello\n', 'first')
  git(['mv', 'old.txt', 'new.txt'], dir)
  await writeFile(join(dir, 'logo.bin'), Buffer.from([0, 0, 1, 2]))
  git(['add', 'new.txt', 'logo.bin'], dir)
  git(['commit', '-m', 'rename and binary'], dir)
  const sha = git(['rev-parse', 'HEAD'], dir)

  const detail = await readCommitDetail(dir, sha)

  const renamed = detail.files.find((file) => file.path === 'new.txt')
  assert.ok(renamed)
  assert.equal(renamed.oldPath, 'old.txt')
  const binary = detail.files.find((file) => file.path === 'logo.bin')
  assert.ok(binary)
  assert.equal(binary.binary, true)
  assert.equal(binary.additions, 0)
  assert.equal(binary.deletions, 0)
})

test('readCommitDetail rejects malformed and missing commits', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')

  await assert.rejects(readCommitDetail(dir, '--all'), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'request/bad-sha')
    return true
  })

  await assert.rejects(readCommitDetail(dir, '0123456789abcdef0123456789abcdef01234567'), (error) => {
    assert.ok(error instanceof GitError)
    assert.equal(error.code, 'git/commit-not-found')
    return true
  })
})

test('readCommitDetail shows the changes a merge brought into its first parent', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'base.txt', 'base\n', 'base')
  git(['switch', '-c', 'feature'], dir)
  await commit(dir, 'feature.txt', 'feature\n', 'feature work')
  git(['switch', 'main'], dir)
  git(['merge', '--no-ff', 'feature', '-m', 'merge feature'], dir)
  const sha = git(['rev-parse', 'HEAD'], dir)

  const detail = await readCommitDetail(dir, sha)

  assert.equal(detail.commit.subject, 'merge feature')
  assert.ok(detail.files.some((file) => file.path === 'feature.txt'))
  assert.match(detail.patch, /\+feature/)
})
