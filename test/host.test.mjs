import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'

import { apply } from '../index.js'
import { commit, git, makePlainDir, makeRepo } from '../test-support/git.mjs'

const SESSION = 'session-test'
const HOST = '127.0.0.1:62895'

function harness(options = {}) {
  const routes = []
  const ctx = {
    logger: { info() {}, warn() {}, error() {} },
    effect(fn) {
      return fn()
    },
    get(service) {
      if (service === 'webServer') {
        return {
          port: 62895,
          register(route) {
            routes.push(route)
            return () => {}
          },
        }
      }
      if (service === 'sessions') {
        return {
          get(id) {
            return id === (options.sessionId ?? SESSION) ? options.live : undefined
          },
        }
      }
      if (service === 'sessionQuery') return options.sessionQuery
      return undefined
    },
  }

  apply(ctx)
  assert.equal(routes.length, 1, 'apply must register exactly one route')
  return routes[0]
}

async function request(route, options = {}) {
  const res = {
    statusCode: 0,
    headers: null,
    payload: '',
    writableEnded: false,
    writeHead(status, headers) {
      this.statusCode = status
      this.headers = headers
    },
    end(body) {
      this.payload = body ?? ''
      this.writableEnded = true
    },
  }

  await route.handler(
    {
      method: options.method ?? 'GET',
      url: options.url ?? `/dsh-plugin-gitrail/repo?session=${SESSION}`,
      headers: { host: options.host ?? HOST },
    },
    res,
  )

  return { status: res.statusCode, body: JSON.parse(res.payload) }
}

test('GET /repo serves the live session workspace', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'README.md', '# demo\n', 'initial commit')

  const route = harness({ live: { header: { cwd: dir } } })
  const { status, body } = await request(route)

  assert.equal(status, 200)
  assert.equal(body.ok, true)
  assert.equal(body.repo.name, basename(dir))
  assert.equal(body.repo.branch, 'main')
  assert.equal(body.repo.commits.length, 1)
  assert.equal(body.repo.commits[0].subject, 'initial commit')
  assert.equal(body.repo.selection.scope, 'all')
})

test('GET /repo scopes commits to one branch and validates the ref', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'initial')
  git(['switch', '-c', 'feature'], dir)
  await commit(dir, 'feature.txt', 'feature\n', 'feature work')
  git(['switch', 'main'], dir)
  await commit(dir, 'main.txt', 'main\n', 'main work')

  const route = harness({ live: { header: { cwd: dir } } })

  const feature = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=branch&ref=refs/heads/feature`,
  })
  assert.equal(feature.status, 200)
  assert.equal(feature.body.repo.selection.scope, 'branch')
  assert.equal(feature.body.repo.selection.ref, 'refs/heads/feature')
  assert.deepEqual(
    feature.body.repo.commits.map((commit) => commit.subject).sort(),
    ['feature work', 'initial'],
  )

  const all = await request(route, { url: `/dsh-plugin-gitrail/repo?session=${SESSION}` })
  assert.deepEqual(
    all.body.repo.commits.map((commit) => commit.subject).sort(),
    ['feature work', 'initial', 'main work'],
  )

  const badScope = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=nope`,
  })
  assert.equal(badScope.status, 400)
  assert.equal(badScope.body.code, 'request/bad-scope')

  const badRef = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=branch&ref=--all`,
  })
  assert.equal(badRef.status, 400)
  assert.equal(badRef.body.code, 'request/bad-ref')

  const unknownRef = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=branch&ref=refs/heads/nope`,
  })
  assert.equal(unknownRef.status, 409)
  assert.equal(unknownRef.body.code, 'git/unknown-ref')

  const allIgnoresRef = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=all&ref=--all`,
  })
  assert.equal(allIgnoresRef.status, 200)
  assert.equal(allIgnoresRef.body.repo.selection.scope, 'all')
})

test('GET /commit returns message, files and patch validation', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'hello\n', 'feat: first')
  const sha = git(['rev-parse', 'HEAD'], dir)
  const route = harness({ live: { header: { cwd: dir } } })

  const ok = await request(route, {
    url: `/dsh-plugin-gitrail/commit?session=${SESSION}&sha=${sha}`,
  })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.ok, true)
  assert.equal(ok.body.commit.subject, 'feat: first')
  assert.equal(ok.body.files[0].path, 'a.txt')
  assert.match(ok.body.patch, /\+hello/)

  const badSha = await request(route, {
    url: `/dsh-plugin-gitrail/commit?session=${SESSION}&sha=--all`,
  })
  assert.equal(badSha.status, 400)
  assert.equal(badSha.body.code, 'request/bad-sha')

  const missing = await request(route, {
    url: `/dsh-plugin-gitrail/commit?session=${SESSION}&sha=0123456789abcdef0123456789abcdef01234567`,
  })
  assert.equal(missing.status, 404)
  assert.equal(missing.body.code, 'git/commit-not-found')
})

test('GET /repo accepts explicit local and remote ref selections', async (t) => {
  const dir = await makeRepo()
  const remote = await makePlainDir()
  t.after(() => rm(dir, { recursive: true, force: true }))
  t.after(() => rm(remote, { recursive: true, force: true }))
  git(['init', '--bare', '-b', 'main'], remote)
  await commit(dir, 'a.txt', 'a\n', 'first')
  git(['remote', 'add', 'origin', remote], dir)
  git(['push', '-u', 'origin', 'main'], dir)
  git(['fetch', 'origin'], dir)
  const route = harness({ live: { header: { cwd: dir } } })

  const response = await request(route, {
    url: `/dsh-plugin-gitrail/repo?session=${SESSION}&scope=refs&local=${encodeURIComponent('refs/heads/main')}&remote=${encodeURIComponent('refs/remotes/origin/main')}`,
  })

  assert.equal(response.status, 200)
  assert.equal(response.body.repo.selection.scope, 'refs')
  assert.deepEqual(response.body.repo.selection.locals, ['refs/heads/main'])
  assert.deepEqual(response.body.repo.selection.remotes, ['refs/remotes/origin/main'])
  assert.equal(response.body.repo.commits[0].subject, 'first')
})

test('GET /repo validates and applies the commit limit', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')
  await commit(dir, 'b.txt', 'b\n', 'second')
  await commit(dir, 'c.txt', 'c\n', 'third')
  const route = harness({ live: { header: { cwd: dir } } })

  const one = await request(route, { url: `/dsh-plugin-gitrail/repo?session=${SESSION}&limit=1` })
  assert.equal(one.status, 200)
  assert.equal(one.body.repo.commits.length, 1)
  assert.equal(one.body.repo.commits[0].subject, 'third')

  const tooSmall = await request(route, { url: `/dsh-plugin-gitrail/repo?session=${SESSION}&limit=0` })
  assert.equal(tooSmall.status, 400)
  assert.equal(tooSmall.body.code, 'request/bad-limit')

  const tooLarge = await request(route, { url: `/dsh-plugin-gitrail/repo?session=${SESSION}&limit=501` })
  assert.equal(tooLarge.status, 400)
  assert.equal(tooLarge.body.code, 'request/bad-limit')
})

test('GET /repo falls back to the session index for a non-live session', async (t) => {
  const dir = await makeRepo()
  t.after(() => rm(dir, { recursive: true, force: true }))
  await commit(dir, 'a.txt', 'a\n', 'first')

  const route = harness({
    live: undefined,
    sessionQuery: {
      async listSessions() {
        return [{ header: { id: SESSION, cwd: dir } }]
      },
    },
  })
  const { status, body } = await request(route)

  assert.equal(status, 200)
  assert.equal(body.repo.commits[0].subject, 'first')
})

test('non-loopback Host headers are refused before git runs', async () => {
  const route = harness({ live: { header: { cwd: 'Z:\\does-not-exist' } } })
  const { status, body } = await request(route, { host: 'evil.example:62895' })

  assert.equal(status, 403)
  assert.equal(body.code, 'http/forbidden')
})

test('unknown sessions and missing workspace directories are distinct errors', async () => {
  const missing = await request(harness({ live: undefined }))
  assert.equal(missing.status, 404)
  assert.equal(missing.body.code, 'session/not-found')

  const noCwd = await request(harness({ live: { header: {} } }))
  assert.equal(noCwd.status, 409)
  assert.equal(noCwd.body.code, 'session/no-cwd')
})

test('a non-repository workspace reports git/not-a-repo', async (t) => {
  const dir = await makePlainDir()
  t.after(() => rm(dir, { recursive: true, force: true }))

  const { status, body } = await request(harness({ live: { header: { cwd: dir } } }))
  assert.equal(status, 409)
  assert.equal(body.code, 'git/not-a-repo')
})

test('request validation rejects bad ids, methods and paths', async () => {
  const route = harness({ live: { header: { cwd: 'Z:\\does-not-exist' } } })

  const badId = await request(route, { url: '/dsh-plugin-gitrail/repo?session=bad%20id' })
  assert.equal(badId.status, 400)
  assert.equal(badId.body.code, 'request/bad-session')

  const badMethod = await request(route, { method: 'POST' })
  assert.equal(badMethod.status, 405)

  const badPath = await request(route, { url: `/dsh-plugin-gitrail/nope?session=${SESSION}` })
  assert.equal(badPath.status, 404)
  assert.equal(badPath.body.code, 'http/not-found')
})

test('a workspace path that disappears reports session/no-cwd', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gitrail-gone-'))
  await rm(dir, { recursive: true, force: true })

  const { status, body } = await request(harness({ live: { header: { cwd: dir } } }))
  assert.equal(status, 409)
  assert.equal(body.code, 'session/no-cwd')
})
