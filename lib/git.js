/**
 * Host-side git adapter for Gitrail.
 *
 * Rules that keep this module small and safe:
 * - read-only commands only; no checkout, fetch, or config writes;
 * - argument arrays only, never a shell string;
 * - one repository per call, resolved from the Session's workspace directory;
 * - bounded output, bounded time, optional locks disabled.
 *
 * @module lib/git
 */

import { execFile } from 'node:child_process'
import { basename } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const GIT_TIMEOUT_MS = 10_000
const GIT_MAX_BUFFER = 4 * 1024 * 1024
const MAX_COMMITS = 80
const MAX_BRANCHES = 200
const FIELD = '\u0000'
/* git's own placeholders for a NUL field separator; argv cannot carry a literal NUL.
 * for-each-ref spells it `%00`, while pretty formats spell it `%x00`. */
const ZERO_REF = '%00'
const ZERO_LOG = '%x00'

/**
 * A git failure with a stable code the HTTP layer and the UI can branch on.
 */
export class GitError extends Error {
  /**
   * @param {string} code stable code such as `git/not-a-repo`.
   * @param {string} message human-readable detail.
   * @param {{ cause?: unknown }} [options] original error.
   */
  constructor(code, message, options) {
    super(message, options)
    this.name = 'GitError'
    this.code = code
  }
}

function gitEnv() {
  return {
    ...process.env,
    GIT_OPTIONAL_LOCKS: '0',
    GIT_TERMINAL_PROMPT: '0',
    GIT_PAGER: 'cat',
    LC_ALL: 'C',
  }
}

/**
 * Run one git command in `cwd`; `allowFailure` returns null for git's own
 * non-zero exits (detached HEAD, unborn branch) while spawn and timeout
 * failures still throw.
 */
async function runGit(cwd, args, { allowFailure = false } = {}) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', cwd, ...args], {
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: GIT_MAX_BUFFER,
      windowsHide: true,
      encoding: 'utf8',
      env: gitEnv(),
    })
    return stdout
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new GitError('git/unavailable', 'git executable not found', { cause: error })
    }
    if (error?.killed || error?.signal) {
      throw new GitError('git/timeout', `git ${args[0] ?? ''} timed out`, { cause: error })
    }
    const stderr = String(error?.stderr ?? '').trim()
    if (/not a git repository/i.test(stderr)) {
      throw new GitError('git/not-a-repo', 'workspace is not a git repository', { cause: error })
    }
    if (/cannot change to|no such file or directory/i.test(stderr)) {
      throw new GitError('repo/no-cwd', 'workspace directory does not exist', { cause: error })
    }
    if (allowFailure) return null
    throw new GitError('git/failed', stderr || String(error?.message ?? error), { cause: error })
  }
}

/**
 * Parse `git status --porcelain=v1 -b`.
 *
 * @param {string} text raw stdout.
 * @returns {{ branch: string, upstream: string, ahead: number, behind: number, detached: boolean, unborn: boolean, changes: number }}
 */
export function parseStatus(text) {
  const lines = String(text ?? '').split(/\r?\n/).filter(Boolean)
  const headerLine = lines[0]?.startsWith('## ') ? lines[0].slice(3) : ''
  const changes = lines.length - (headerLine === '' ? 0 : 1)

  let branch = ''
  let upstream = ''
  let ahead = 0
  let behind = 0
  let detached = false
  let unborn = false

  if (headerLine !== '') {
    const track = headerLine.match(/\[([^\]]*)\]/)?.[1] ?? ''
    const withoutTrack = headerLine.replace(/ \[[^\]]*\]$/, '')
    ahead = Number(track.match(/ahead (\d+)/)?.[1] ?? 0)
    behind = Number(track.match(/behind (\d+)/)?.[1] ?? 0)

    if (withoutTrack === 'HEAD (no branch)') {
      detached = true
    } else if (withoutTrack.startsWith('No commits yet on ')) {
      unborn = true
      branch = withoutTrack.slice('No commits yet on '.length)
    } else {
      const [name, up] = withoutTrack.split('...')
      branch = name ?? ''
      upstream = up ?? ''
    }
  }

  return { branch, upstream, ahead, behind, detached, unborn, changes }
}

/**
 * Parse `git for-each-ref` rows produced by {@link readRepoState}.
 *
 * @param {string | null} text raw stdout.
 * @returns {{ locals: object[], remotes: object[] }}
 */
export function parseRefs(text) {
  const locals = []
  const remotes = []

  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (line === '') continue
    const [refname, short, sha, headMark, upstream, date, subject] = line.split(FIELD)
    if (!refname || !short) continue
    const row = {
      name: short,
      sha: sha ?? '',
      upstream: upstream ?? '',
      date: date ?? '',
      subject: subject ?? '',
      current: headMark === '*',
    }
    if (refname.startsWith('refs/heads/')) locals.push(row)
    else if (refname.startsWith('refs/remotes/') && !short.endsWith('/HEAD')) remotes.push(row)
  }

  locals.sort((a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name))
  remotes.sort((a, b) => a.name.localeCompare(b.name))

  return {
    locals: locals.slice(0, MAX_BRANCHES),
    remotes: remotes.slice(0, MAX_BRANCHES),
  }
}

/**
 * Parse `git log` rows produced by {@link readRepoState}.
 *
 * @param {string | null} text raw stdout.
 * @returns {object[]}
 */
export function parseLog(text) {
  const commits = []

  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (line === '') continue
    const fields = line.split(FIELD)
    if (fields.length < 8) continue
    const [sha, short, parents, author, email, date, subject, refs] = fields
    commits.push({
      sha,
      short,
      parents: parents === '' ? [] : parents.split(' '),
      author,
      email,
      date,
      subject,
      refs: refs === '' ? [] : refs.split(', ').map((ref) => ref.trim()).filter(Boolean),
    })
  }

  return commits.slice(0, MAX_COMMITS)
}

/**
 * Read the repository that contains `cwd`.
 *
 * @param {string} cwd absolute workspace directory from the Session.
 * @returns {Promise<object>} repository state shaped for the Client.
 * @throws {GitError} when git is missing, the path is not a repository, or git fails.
 */
export async function readRepoState(cwd) {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new GitError('repo/no-cwd', 'session has no workspace directory')
  }

  const rootOut = await runGit(cwd, ['rev-parse', '--show-toplevel'])
  const root = rootOut.trim().split(/\r?\n/)[0]
  if (root === '') {
    throw new GitError('git/not-a-repo', 'workspace is not a git repository')
  }

  const [statusOut, refsOut, logOut, headOut] = await Promise.all([
    runGit(root, ['status', '--porcelain=v1', '-b']),
    runGit(
      root,
      [
        'for-each-ref',
        `--format=%(refname)${ZERO_REF}%(refname:short)${ZERO_REF}%(objectname:short)${ZERO_REF}%(HEAD)${ZERO_REF}%(upstream:short)${ZERO_REF}%(committerdate:iso-strict)${ZERO_REF}%(subject)`,
        'refs/heads',
        'refs/remotes',
      ],
      { allowFailure: true },
    ),
    runGit(
      root,
      [
        'log',
        `--max-count=${MAX_COMMITS}`,
        '--date=iso-strict',
        `--pretty=format:%H${ZERO_LOG}%h${ZERO_LOG}%P${ZERO_LOG}%an${ZERO_LOG}%ae${ZERO_LOG}%ad${ZERO_LOG}%s${ZERO_LOG}%D`,
        'HEAD',
      ],
      { allowFailure: true },
    ),
    runGit(root, ['rev-parse', '--short', 'HEAD'], { allowFailure: true }),
  ])

  const status = parseStatus(statusOut)
  const branches = parseRefs(refsOut)
  const head = headOut?.trim() ?? ''

  return {
    root,
    name: basename(root) || root,
    head,
    branch: status.branch,
    upstream: status.upstream,
    detached: status.detached,
    unborn: status.unborn,
    ahead: status.ahead,
    behind: status.behind,
    changes: status.changes,
    branches,
    commits: parseLog(logOut),
    generatedAt: new Date().toISOString(),
  }
}
