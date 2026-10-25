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
const GIT_MAX_BUFFER = 12 * 1024 * 1024
const MAX_COMMITS = 80
const MAX_BRANCHES = 200
const MAX_REF_LENGTH = 300
const MAX_BODY_BYTES = 16 * 1024
const MAX_FILES = 200
const MAX_PATCH_BYTES = 512 * 1024
const SHA_PATTERN = /^[0-9a-f]{7,40}$/
const DEFAULT_SCOPE = 'all'
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
      refname,
      name: short,
      sha: sha ?? '',
      upstream: upstream ?? '',
      date: date ?? '',
      subject: subject ?? '',
      current: headMark === '*',
    }
    if (refname.startsWith('refs/heads/')) locals.push(row)
    else if (refname.startsWith('refs/remotes/') && !refname.endsWith('/HEAD')) remotes.push(row)
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
      refs:
        refs === ''
          ? []
          : refs
              .split(', ')
              .map((ref) => ref.trim())
              .filter(Boolean)
              .filter((ref) => !ref.endsWith('/HEAD')),
    })
  }

  return commits.slice(0, MAX_COMMITS)
}

/**
 * Read the repository that contains `cwd`.
 *
 * @param {string} cwd absolute workspace directory from the Session.
 * @param {{ scope?: 'all' | 'branch', ref?: string }} [options] commit range;
 *   `all` covers every local and remote-tracking branch, `branch` covers one
 *   allow-listed ref (or `HEAD`). The default is all branches.
 * @returns {Promise<object>} repository state shaped for the Client.
 * @throws {GitError} when git is missing, the path is not a repository, the
 *   scope or ref is invalid, or git fails.
 */
export async function readRepoState(cwd, options = {}) {
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new GitError('repo/no-cwd', 'session has no workspace directory')
  }

  const scope = options.scope === undefined ? DEFAULT_SCOPE : options.scope
  if (scope !== 'all' && scope !== 'branch') {
    throw new GitError('request/bad-scope', 'scope must be "all" or "branch"')
  }
  const ref = typeof options.ref === 'string' && options.ref.trim() !== '' ? options.ref.trim() : 'HEAD'
  if (scope === 'branch' && (ref.length > MAX_REF_LENGTH || ref.startsWith('-') || /[\s\u0000-\u001f]/.test(ref))) {
    throw new GitError('request/bad-ref', 'invalid branch reference')
  }

  const rootOut = await runGit(cwd, ['rev-parse', '--show-toplevel'])
  const root = rootOut.trim().split(/\r?\n/)[0]
  if (root === '') {
    throw new GitError('git/not-a-repo', 'workspace is not a git repository')
  }

  const [statusOut, refsOut, headOut] = await Promise.all([
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
    runGit(root, ['rev-parse', '--short', 'HEAD'], { allowFailure: true }),
  ])

  const status = parseStatus(statusOut)
  const branches = parseRefs(refsOut)
  const head = headOut?.trim() ?? ''

  if (scope === 'branch') {
    const allowed = new Set(['HEAD'])
    for (const branch of branches.locals) allowed.add(branch.refname)
    for (const branch of branches.remotes) allowed.add(branch.refname)
    if (!allowed.has(ref)) {
      throw new GitError('git/unknown-ref', 'unknown branch reference')
    }
  }

  const logArgs = [
    'log',
    `--max-count=${MAX_COMMITS}`,
    '--date=iso-strict',
    '--topo-order',
    `--pretty=format:%H${ZERO_LOG}%h${ZERO_LOG}%P${ZERO_LOG}%an${ZERO_LOG}%ae${ZERO_LOG}%ad${ZERO_LOG}%s${ZERO_LOG}%D`,
  ]
  if (scope === 'all') {
    logArgs.push('--branches', '--remotes')
  } else {
    logArgs.push(ref, '--')
  }
  const logOut = await runGit(root, logArgs, { allowFailure: true })

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
    selection: scope === 'all' ? { scope: 'all', detached: status.detached } : { scope: 'branch', ref, detached: status.detached },
    branches,
    commits: parseLog(logOut),
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Parse `git show --numstat` rows.
 *
 * @param {string | null} text raw stdout.
 * @returns {object[]} file changes in display order.
 */
export function parseNumstat(text) {
  const files = []
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (line === '') continue
    const parts = line.split('\t')
    if (parts.length < 3) continue
    const [additions, deletions, rawPath] = parts
    const binary = additions === '-' || deletions === '-'
    let path = rawPath
    let oldPath = null

    const brace = rawPath.match(/^(.*)\{(.*) => (.*)\}(.*)$/)
    if (brace) {
      oldPath = `${brace[1]}${brace[2]}${brace[4]}`
      path = `${brace[1]}${brace[3]}${brace[4]}`
    } else {
      const arrow = rawPath.match(/^(.*) => (.*)$/)
      if (arrow) {
        oldPath = arrow[1].trim()
        path = arrow[2].trim()
      }
    }

    files.push({
      path,
      oldPath,
      additions: binary ? 0 : Number(additions) || 0,
      deletions: binary ? 0 : Number(deletions) || 0,
      binary,
    })
  }
  return files
}

/**
 * Read one commit's details, file stats, and a bounded patch.
 *
 * @param {string} cwd Session workspace directory.
 * @param {string} sha full or abbreviated commit SHA.
 * @returns {Promise<object>} commit details shaped for the Client.
 * @throws {GitError} on an invalid or missing commit, or a failed git command.
 */
export async function readCommitDetail(cwd, sha) {
  const commitSha = typeof sha === 'string' ? sha.trim().toLowerCase() : ''
  if (!SHA_PATTERN.test(commitSha)) {
    throw new GitError('request/bad-sha', 'invalid commit SHA')
  }
  if (typeof cwd !== 'string' || cwd.trim() === '') {
    throw new GitError('repo/no-cwd', 'session has no workspace directory')
  }

  const rootOut = await runGit(cwd, ['rev-parse', '--show-toplevel'])
  const root = rootOut.trim().split(/\r?\n/)[0]
  if (root === '') {
    throw new GitError('git/not-a-repo', 'workspace is not a git repository')
  }

  const exists = await runGit(root, ['cat-file', '-e', `${commitSha}^{commit}`], { allowFailure: true })
  if (exists === null) {
    throw new GitError('git/commit-not-found', 'commit not found')
  }

  const format = ['%H', '%P', '%an', '%ae', '%aI', '%cn', '%ce', '%cI', '%s', '%D', '%b'].join(ZERO_LOG)
  const [metaOut, numstatOut, patchOut] = await Promise.all([
    runGit(root, ['show', '-s', `--format=${format}`, commitSha]),
    runGit(root, ['show', '--numstat', '--format=', '--find-renames', '-m', '--first-parent', commitSha], {
      allowFailure: true,
    }),
    runGit(
      root,
      ['show', '--format=', '--patch', '--no-color', '--find-renames', '-m', '--first-parent', commitSha],
      { allowFailure: true },
    ),
  ])

  const fields = metaOut.split(FIELD)
  if (fields.length < 11) {
    throw new GitError('git/failed', 'malformed commit metadata')
  }

  let body = fields[10] ?? ''
  const bodyTruncated = body.length > MAX_BODY_BYTES
  if (bodyTruncated) body = body.slice(0, MAX_BODY_BYTES)

  const allFiles = parseNumstat(numstatOut)
  const files = allFiles.slice(0, MAX_FILES)
  const patchText = patchOut ?? ''
  const patchTruncated = patchText.length > MAX_PATCH_BYTES

  return {
    commit: {
      sha: fields[0],
      parents: fields[1] === '' ? [] : fields[1].split(' '),
      author: { name: fields[2], email: fields[3], date: fields[4] },
      committer: { name: fields[5], email: fields[6], date: fields[7] },
      subject: fields[8],
      refs: fields[9] === '' ? [] : fields[9].split(', ').map((ref) => ref.trim()).filter(Boolean),
      body,
      bodyTruncated,
    },
    files,
    filesTruncated: allFiles.length > MAX_FILES,
    patch: patchText.slice(0, MAX_PATCH_BYTES),
    patchTruncated,
    patchUnavailable: patchOut === null,
  }
}
