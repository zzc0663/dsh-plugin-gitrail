import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import test from 'node:test'

import { apply } from '../index.js'
import { commit, makePlainDir, makeRepo } from '../test-support/git.mjs'

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
