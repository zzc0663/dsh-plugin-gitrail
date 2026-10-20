/**
 * dsh-plugin-gitrail — Host half.
 *
 * Serves one read-only endpoint, `GET /dsh-plugin-gitrail/repo?session=<id>`,
 * on the existing loopback Web server. The repository is resolved from the
 * Session's workspace directory; the browser never supplies a filesystem path.
 *
 * The Client half (`client.js`) registers the right-sidebar tab that reads it.
 *
 * @module dsh-plugin-gitrail
 */

import { GitError, readRepoState } from './lib/git.js'

export const name = 'dsh-plugin-gitrail'

/** The Web server is the only required service; session lookups are optional. */
export const inject = ['webServer']

const BASE = '/dsh-plugin-gitrail'
const SESSION_ID = /^[A-Za-z0-9._:-]{1,200}$/

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  if (res.writableEnded) return
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(payload)
}

/**
 * Only the local UI may read repository data. The Host header is checked
 * against loopback spellings; proxied or LAN requests are refused.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {number | undefined} expectedPort
 * @returns {boolean}
 */
function isLoopbackRequest(req, expectedPort) {
  const hostHeader = req.headers.host
  if (typeof hostHeader !== 'string' || hostHeader === '') return false

  let url
  try {
    url = new URL(`http://${hostHeader}`)
  } catch {
    return false
  }

  const host = url.hostname.replace(/^\[|\]$/g, '')
  const loopback = host === 'localhost' || host === '::1' || /^127\.\d+\.\d+\.\d+$/.test(host)
  if (!loopback) return false
  if (expectedPort !== undefined && url.port !== '' && Number(url.port) !== expectedPort) return false
  return true
}

/**
 * @param {unknown} value
 * @returns {string | undefined}
 */
function asCwd(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/**
 * Resolve a Session to its workspace directory. Live Sessions win; the
 * session index covers Sessions that are not attached in this process.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {string} sessionId
 * @returns {Promise<{ found: boolean, cwd?: string }>}
 */
async function resolveSession(ctx, sessionId) {
  try {
    const sessions = ctx.get('sessions')
    const live = sessions?.get?.(sessionId)
    if (live !== undefined && live !== null) {
      return { found: true, cwd: asCwd(live.header?.cwd ?? live.meta?.cwd) }
    }
  } catch (error) {
    ctx.logger?.warn?.(`[gitrail] live session lookup failed: ${error?.message ?? error}`)
  }

  try {
    const query = ctx.get('sessionQuery')
    if (query !== undefined && query !== null && typeof query.listSessions === 'function') {
      const rows = await query.listSessions()
      if (Array.isArray(rows)) {
        const row = rows.find((entry) => (entry?.header?.id ?? entry?.id) === sessionId)
        if (row !== undefined && row !== null) {
          return { found: true, cwd: asCwd(row.header?.cwd ?? row.cwd) }
        }
      }
    }
  } catch (error) {
    ctx.logger?.warn?.(`[gitrail] session index lookup failed: ${error?.message ?? error}`)
  }

  return { found: false }
}

/**
 * @param {GitError} error
 * @returns {{ status: number, code: string }}
 */
function statusOfGitError(error) {
  switch (error.code) {
    case 'repo/no-cwd':
      return { status: 409, code: 'session/no-cwd' }
    case 'git/not-a-repo':
      return { status: 409, code: 'git/not-a-repo' }
    case 'git/unavailable':
      return { status: 503, code: 'git/unavailable' }
    case 'git/timeout':
      return { status: 504, code: 'git/timeout' }
    default:
      return { status: 500, code: 'git/failed' }
  }
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined || webServer === null) {
    ctx.logger?.error?.(`[${name}] webServer unavailable; plugin inactive`)
    return
  }

  const port = typeof webServer.port === 'number' ? webServer.port : undefined

  ctx.effect(
    () =>
      webServer.register({
        kind: 'prefix',
        path: BASE,
        handler: async (req, res) => {
          try {
            if (!isLoopbackRequest(req, port)) {
              sendJson(res, 403, { ok: false, code: 'http/forbidden', message: 'loopback host required' })
              return
            }
            if (req.method !== 'GET') {
              sendJson(res, 405, { ok: false, code: 'http/method-not-allowed', message: 'GET only' })
              return
            }

            const url = new URL(req.url ?? '/', 'http://localhost')
            if (url.pathname !== `${BASE}/repo`) {
              sendJson(res, 404, { ok: false, code: 'http/not-found', message: 'unknown route' })
              return
            }

            const sessionId = (url.searchParams.get('session') ?? '').trim()
            if (!SESSION_ID.test(sessionId)) {
              sendJson(res, 400, { ok: false, code: 'request/bad-session', message: 'invalid session id' })
              return
            }

            const session = await resolveSession(ctx, sessionId)
            if (!session.found) {
              sendJson(res, 404, { ok: false, code: 'session/not-found', message: 'session not found' })
              return
            }
            if (session.cwd === undefined) {
              sendJson(res, 409, { ok: false, code: 'session/no-cwd', message: 'session has no workspace directory' })
              return
            }

            const repo = await readRepoState(session.cwd)
            sendJson(res, 200, { ok: true, repo })
          } catch (error) {
            if (error instanceof GitError) {
              const { status, code } = statusOfGitError(error)
              sendJson(res, status, { ok: false, code, message: error.message })
              return
            }
            ctx.logger?.warn?.(`[gitrail] request failed: ${error?.stack ?? error}`)
            sendJson(res, 500, { ok: false, code: 'server/failed', message: 'failed to read repository' })
          }
        },
      }),
    'gitrail: http routes',
  )
}
