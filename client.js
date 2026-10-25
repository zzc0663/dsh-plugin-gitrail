/* dsh-plugin-gitrail — Client half (browser bundle).
 *
 * Module format: window.__ModuleLoader__.load({ id, factory }) with plain JS
 * and React.createElement — no JSX, no import, no build step. The id must
 * equal the package name, and the tab body registers under the same id.
 *
 * Surface: a page type in the right sidebar ("gitrail"). The type and its
 * guide entry are registered through ctx.sidebarRightTabs; the body mounts in
 * the keyed `sidebar.right.pane.tab` seat. All repository data comes from the
 * Host route /dsh-plugin-gitrail/repo; the browser never reads files.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-gitrail',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const ID = 'dsh-plugin-gitrail'
    const KIND = 'gitrail'
    const NS = 'gitrail'
    const ENDPOINT = '/dsh-plugin-gitrail/repo'

    /* ================= copy ================= */

    const zh = {
      'app.title': 'Gitrail',
      'type.label': 'Gitrail',
      'guide.title': '仓库',
      'guide.description': '分支与提交的侧栏视图',
      'action.refresh': '刷新',
      'action.retry': '重试',
      'state.loading': '正在读取仓库…',
      'state.noSession': '请先选择一个会话',
      'state.noBranches': '没有分支',
      'state.noCommits': '没有提交',
      'state.unborn': '这个仓库还没有提交',
      'state.unbornHint': '创建第一个提交后，分支与提交会出现在这里。',
      'section.branches': '分支',
      'section.remotes': '远程分支',
      'section.commits': '最近提交',
      'scope.all': '所有分支',
      'scope.current': '当前分支',
      'scope.local': '本地分支',
      'scope.remote': '远程分支',
      'scope.unknown': '未知分支',
      'scope.menu': '选择提交范围',
      'scope.missing': '该分支已不存在，已切换到所有分支。',
      'scope.emptyAll': '所有分支还没有提交',
      'scope.emptyBranch': '该分支还没有提交',
      'meta.detached': '游离 HEAD',
      'meta.unborn': '空仓库',
      'meta.ahead': '领先',
      'meta.behind': '落后',
      'meta.changes': '处改动',
      'commit.noSubject': '（无提交说明）',
      'footer.readonly': '只读 · 由宿主读取 git',
      'error.sessionNotFound': '找不到这个会话，请重新打开 Gitrail 标签。',
      'error.noCwd': '该会话没有工作目录，无法定位仓库。',
      'error.notARepo': '当前工作目录不是 git 仓库。',
      'error.gitUnavailable': '找不到 git 可执行文件，请确认它已安装并在 PATH 中。',
      'error.timeout': 'git 命令超时，仓库可能过大或磁盘繁忙。',
      'error.network': '无法连接宿主，请刷新页面后重试。',
      'error.http': '宿主返回了无法识别的响应。',
      'error.generic': '读取仓库失败。',
    }

    const en = {
      'app.title': 'Gitrail',
      'type.label': 'Gitrail',
      'guide.title': 'Repository',
      'guide.description': 'Branches and commits in the sidebar',
      'action.refresh': 'Refresh',
      'action.retry': 'Retry',
      'state.loading': 'Reading repository…',
      'state.noSession': 'Select a session first',
      'state.noBranches': 'No branches',
      'state.noCommits': 'No commits',
      'state.unborn': 'This repository has no commits yet',
      'state.unbornHint': 'Branches and commits appear after the first commit.',
      'section.branches': 'Branches',
      'section.remotes': 'Remote branches',
      'section.commits': 'Recent commits',
      'scope.all': 'All branches',
      'scope.current': 'Current branch',
      'scope.local': 'Local branches',
      'scope.remote': 'Remote branches',
      'scope.unknown': 'Unknown branch',
      'scope.menu': 'Select commit range',
      'scope.missing': 'That branch no longer exists. Showing all branches.',
      'scope.emptyAll': 'No commits on any branch',
      'scope.emptyBranch': 'No commits on this branch',
      'meta.detached': 'Detached HEAD',
      'meta.unborn': 'Empty repository',
      'meta.ahead': 'ahead',
      'meta.behind': 'behind',
      'meta.changes': 'changes',
      'commit.noSubject': '(no commit message)',
      'footer.readonly': 'Read-only · git runs on the host',
      'error.sessionNotFound': 'This session no longer exists. Reopen the Gitrail tab.',
      'error.noCwd': 'This session has no workspace directory.',
      'error.notARepo': 'The workspace is not a git repository.',
      'error.gitUnavailable': 'git was not found. Install it and make sure it is on PATH.',
      'error.timeout': 'git timed out; the repository may be large or the disk busy.',
      'error.network': 'Could not reach the host. Refresh the page and try again.',
      'error.http': 'The host returned an unrecognized response.',
      'error.generic': 'Could not read the repository.',
    }

    /* ================= icons ================= */

    function RailGlyph(props) {
      const size = props && typeof props.size === 'number' ? props.size : 16
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', { d: 'M5 13V3', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
        h('path', {
          d: 'M5 9c0-3 5.2-2 5.2-5.2V3',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
        }),
        h('circle', { cx: 5, cy: 13, r: 1.7, fill: 'currentColor' }),
        h('circle', { cx: 5, cy: 3, r: 1.7, fill: 'currentColor' }),
        h('circle', { cx: 10.2, cy: 3, r: 1.7, fill: 'currentColor' }),
      )
    }

    function RefreshGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('path', {
          d: 'M13 8a5 5 0 1 1-1.6-3.7',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M13 2.8v2.9H10.1',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    /* ================= data ================= */

    function useRepo(sessionId, scope, nonce) {
      const [state, setState] = React.useState({ status: 'idle', data: null, error: null, sessionId: null })

      React.useEffect(() => {
        if (!sessionId) {
          setState({ status: 'no-session', data: null, error: null, sessionId: null })
          return undefined
        }

        const controller = new AbortController()
        let alive = true
        setState((prev) => ({
          status: 'loading',
          data: prev.sessionId === sessionId ? prev.data : null,
          error: null,
          sessionId,
        }))

        const params = new URLSearchParams({ session: sessionId })
        if (scope && scope.kind === 'all') {
          params.set('scope', 'all')
        } else {
          params.set('scope', 'branch')
          params.set('ref', (scope && scope.ref) || 'HEAD')
        }

        fetch(`${ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
          cache: 'no-store',
          credentials: 'same-origin',
        })
          .then(async (response) => {
            let body = null
            try {
              body = await response.json()
            } catch {
              body = null
            }
            if (!response.ok || body === null || body.ok !== true) {
              const error = new Error((body && body.message) || `HTTP ${response.status}`)
              error.code = (body && body.code) || `http/${response.status}`
              throw error
            }
            if (alive) setState({ status: 'ready', data: body.repo, error: null, sessionId })
          })
          .catch((error) => {
            if (!alive || (error && error.name === 'AbortError')) return
            setState((prev) => ({
              status: 'error',
              data: prev.sessionId === sessionId ? prev.data : null,
              error: { code: (error && error.code) || 'network/failed', message: (error && error.message) || '' },
              sessionId,
            }))
          })

        return () => {
          alive = false
          controller.abort()
        }
      }, [sessionId, scope && scope.kind, scope && scope.ref, nonce])

      return state
    }

    const RELATIVE = (() => {
      try {
        return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' })
      } catch {
        return null
      }
    })()

    function timeAgo(iso) {
      const time = Date.parse(iso)
      if (!Number.isFinite(time)) return ''
      const diff = Date.now() - time
      const minute = 60_000
      const hour = 60 * minute
      const day = 24 * hour

      if (diff < hour) {
        const value = Math.max(1, Math.round(diff / minute))
        return RELATIVE ? RELATIVE.format(-value, 'minute') : `${value}m`
      }
      if (diff < day) return RELATIVE ? RELATIVE.format(-Math.round(diff / hour), 'hour') : `${Math.round(diff / hour)}h`
      if (diff < 30 * day) return RELATIVE ? RELATIVE.format(-Math.round(diff / day), 'day') : `${Math.round(diff / day)}d`

      try {
        return new Date(time).toLocaleDateString(undefined, {
          year: diff >= 365 * day ? 'numeric' : undefined,
          month: 'short',
          day: 'numeric',
        })
      } catch {
        return new Date(time).toISOString().slice(0, 10)
      }
    }

    function errorText(t, error) {
      switch (error && error.code) {
        case 'session/not-found':
        case 'request/bad-session':
          return t('error.sessionNotFound')
        case 'session/no-cwd':
          return t('error.noCwd')
        case 'git/not-a-repo':
          return t('error.notARepo')
        case 'git/unavailable':
          return t('error.gitUnavailable')
        case 'git/timeout':
          return t('error.timeout')
        case 'network/failed':
          return t('error.network')
        case 'git/unknown-ref':
        case 'request/bad-ref':
          return t('scope.missing')
        default:
          if (typeof (error && error.code) === 'string' && error.code.startsWith('http/')) return t('error.http')
          return (error && error.message) || t('error.generic')
      }
    }

    function prettyRef(ref) {
      if (ref.startsWith('HEAD -> ')) return 'HEAD'
      if (ref.startsWith('tag: ')) return `#${ref.slice(5)}`
      return ref
    }

    let scopeMenuSeq = 0

    function ScopeMenu(props) {
      const { repo, scope, onChange, disabled } = props
      const t = props.t
      const [open, setOpen] = React.useState(false)
      const [active, setActive] = React.useState(0)
      const wrapRef = React.useRef(null)
      const listRef = React.useRef(null)
      const triggerRef = React.useRef(null)
      const optionRefs = React.useRef([])
      const listId = React.useMemo(() => `gr-scope-${++scopeMenuSeq}`, [])

      const locals = repo && repo.branches && Array.isArray(repo.branches.locals) ? repo.branches.locals : []
      const remotes = repo && repo.branches && Array.isArray(repo.branches.remotes) ? repo.branches.remotes : []
      const currentLabel =
        repo && repo.branch && !repo.detached ? `${t('scope.current')} · ${repo.branch}` : t('scope.current')
      const options = [
        { key: 'all', kind: 'all', label: t('scope.all'), group: 'all' },
        { key: 'HEAD', kind: 'branch', ref: 'HEAD', label: currentLabel, group: 'current' },
        ...locals.map((branch) => ({
          key: branch.refname || `refs/heads/${branch.name}`,
          kind: 'branch',
          ref: branch.refname || `refs/heads/${branch.name}`,
          label: branch.name,
          group: 'local',
        })),
        ...remotes.map((branch) => ({
          key: branch.refname || `refs/remotes/${branch.name}`,
          kind: 'branch',
          ref: branch.refname || `refs/remotes/${branch.name}`,
          label: branch.name,
          group: 'remote',
        })),
      ]
      const selectedKey = scope.kind === 'all' ? 'all' : scope.ref || 'HEAD'
      const selectedIndex = options.findIndex((option) => option.key === selectedKey)
      const selected = options[selectedIndex] || options[0]

      const close = (focusTrigger) => {
        setOpen(false)
        if (focusTrigger && triggerRef.current !== null) triggerRef.current.focus()
      }

      const choose = (option) => {
        setOpen(false)
        onChange(option.kind === 'all' ? { kind: 'all' } : { kind: 'branch', ref: option.ref })
        if (triggerRef.current !== null) triggerRef.current.focus()
      }

      React.useEffect(() => {
        if (!open) return undefined
        const onDocumentMouseDown = (event) => {
          if (wrapRef.current !== null && !wrapRef.current.contains(event.target)) close(false)
        }
        document.addEventListener('mousedown', onDocumentMouseDown)
        const index = Math.max(
          0,
          options.findIndex((option) => option.key === selectedKey),
        )
        setActive(index)
        const raf = requestAnimationFrame(() => {
          if (listRef.current !== null) listRef.current.focus()
        })
        return () => {
          document.removeEventListener('mousedown', onDocumentMouseDown)
          cancelAnimationFrame(raf)
        }
      }, [open])

      React.useEffect(() => {
        if (!open) return
        const element = optionRefs.current[active]
        if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' })
      }, [open, active])

      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          close(true)
          return
        }
        if (event.key === 'Tab') {
          setOpen(false)
          return
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setActive((value) => (value + 1) % options.length)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setActive((value) => (value - 1 + options.length) % options.length)
          return
        }
        if (event.key === 'Home') {
          event.preventDefault()
          setActive(0)
          return
        }
        if (event.key === 'End') {
          event.preventDefault()
          setActive(options.length - 1)
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          choose(options[active])
        }
      }

      const rows = []
      let lastGroup = ''
      options.forEach((option, index) => {
        if (option.group !== lastGroup && (option.group === 'local' || option.group === 'remote')) {
          rows.push(
            h(
              'div',
              { key: `group-${option.group}`, className: 'gr-scope-group', role: 'presentation' },
              t(option.group === 'local' ? 'scope.local' : 'scope.remote'),
            ),
          )
        }
        lastGroup = option.group
        rows.push(
          h(
            'div',
            {
              key: option.key,
              id: `${listId}-${index}`,
              ref: (element) => {
                optionRefs.current[index] = element
              },
              role: 'option',
              'aria-selected': option.key === selectedKey,
              className: `gr-scope-option${index === active ? ' is-active' : ''}${
                option.key === selectedKey ? ' is-selected' : ''
              }`,
              onMouseEnter: () => setActive(index),
              onClick: () => choose(option),
            },
            h('span', { className: 'gr-scope-option-label' }, option.label),
            option.key === selectedKey
              ? h('span', { className: 'gr-scope-check', 'aria-hidden': true }, '✓')
              : null,
          ),
        )
      })

      return h(
        'div',
        { className: 'gr-scope-wrap', ref: wrapRef },
        h(
          'button',
          {
            type: 'button',
            ref: triggerRef,
            className: 'gr-scope-trigger',
            disabled: Boolean(disabled),
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            'aria-controls': open ? listId : undefined,
            'aria-label': `${t('scope.menu')}: ${selected.label}`,
            title: t('scope.menu'),
            onClick: () => setOpen((value) => !value),
            onKeyDown: (event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setOpen(true)
              }
            },
          },
          h('span', { className: 'gr-scope-trigger-label' }, selected.label),
          h('span', { className: 'gr-scope-caret', 'aria-hidden': true }, '▾'),
        ),
        open
          ? h(
              'div',
              {
                className: 'gr-scope-menu',
                role: 'listbox',
                id: listId,
                tabIndex: -1,
                ref: listRef,
                'aria-label': t('scope.menu'),
                'aria-activedescendant': `${listId}-${active}`,
                onKeyDown,
              },
              rows,
            )
          : null,
      )
    }

    /* ================= view ================= */

    function BranchRow(props) {
      const branch = props.branch
      const selected = Boolean(props.selected)
      const onSelect = () => {
        if (typeof props.onSelect === 'function') props.onSelect(branch)
      }

      return h(
        'div',
        {
          className: `gr-branch${branch.current ? ' is-current' : ''}${selected ? ' is-scoped' : ''}`,
          role: 'button',
          tabIndex: 0,
          'aria-current': selected ? 'true' : undefined,
          title: [branch.name, branch.subject, branch.date].filter(Boolean).join('\n'),
          onClick: onSelect,
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onSelect()
            }
          },
        },
        h('span', { className: 'gr-branch-dot', 'aria-hidden': true }),
        h(
          'span',
          { className: 'gr-branch-label' },
          h('span', { className: 'gr-branch-name' }, branch.name),
          branch.upstream ? h('span', { className: 'gr-branch-up' }, branch.upstream) : null,
        ),
        h(
          'span',
          { className: 'gr-branch-right' },
          selected ? h('span', { className: 'gr-branch-check', 'aria-hidden': true }, '✓') : null,
          h('code', { className: 'gr-sha' }, branch.sha),
        ),
      )
    }

    function CommitRow(props) {
      const commit = props.commit
      const refs = commit.refs.slice(0, 4)
      const extra = commit.refs.length - refs.length

      return h(
        'li',
        {
          className: 'gr-commit',
          title: `${commit.sha}\n${commit.author} <${commit.email}>`,
        },
        h('span', { className: 'gr-rail', 'aria-hidden': true }, h('span', { className: 'gr-dot' })),
        h(
          'div',
          { className: 'gr-commit-body' },
          h('div', { className: 'gr-subject' }, commit.subject || props.t('commit.noSubject')),
          h(
            'div',
            { className: 'gr-meta' },
            h('code', { className: 'gr-sha' }, commit.short),
            h('span', { className: 'gr-author' }, commit.author),
            h('span', { className: 'gr-time' }, timeAgo(commit.date)),
            refs.length > 0
              ? h(
                  'span',
                  { className: 'gr-refs' },
                  refs.map((ref) =>
                    h(
                      'span',
                      {
                        key: ref,
                        className: `gr-ref${ref.startsWith('tag:') ? ' is-tag' : ''}`,
                        title: ref,
                      },
                      prettyRef(ref),
                    ),
                  ),
                  extra > 0 ? h('span', { className: 'gr-ref is-more' }, `+${extra}`) : null,
                )
              : null,
          ),
        ),
      )
    }

    function Notice(props) {
      return h(
        'div',
        { className: `gr-notice${props.tone ? ` is-${props.tone}` : ''}` },
        h('div', { className: 'gr-notice-title' }, props.title),
        props.hint ? h('div', { className: 'gr-notice-hint' }, props.hint) : null,
      )
    }

    function Skeleton() {
      return h(
        'div',
        { className: 'gr-skeleton', 'aria-hidden': true },
        h('span', { style: { width: '58%' } }),
        h('span', { style: { width: '86%' } }),
        h('span', { style: { width: '72%' } }),
      )
    }

    function GitrailBody(props) {
      const sessionId = props.sessionId
      const translate = props.t
      const t = (key) => {
        if (typeof translate !== 'function') return key
        try {
          return translate(key)
        } catch {
          return key
        }
      }

      const [nonce, setNonce] = React.useState(0)
      const [scope, setScope] = React.useState({ kind: 'all' })
      const [notice, setNotice] = React.useState(null)
      const state = useRepo(sessionId, scope, nonce)
      const repo = state.data
      const loading = state.status === 'loading'
      const refresh = () => {
        setNotice(null)
        setNonce((value) => value + 1)
      }

      const sessionRef = React.useRef(sessionId)
      React.useEffect(() => {
        if (sessionRef.current === sessionId) return
        sessionRef.current = sessionId
        setScope({ kind: 'all' })
        setNotice(null)
      }, [sessionId])

      React.useEffect(() => {
        if (!state.error) return
        if (
          (state.error.code === 'git/unknown-ref' || state.error.code === 'request/bad-ref') &&
          scope.kind === 'branch' &&
          scope.ref !== 'HEAD'
        ) {
          setNotice(t('scope.missing'))
          setScope({ kind: 'all' })
        }
      }, [state.error, scope.kind, scope.ref])

      React.useEffect(() => {
        if (state.status === 'ready' && notice !== null) setNotice(null)
      }, [state.status])

      let content
      if (!sessionId) {
        content = h(Notice, { title: t('state.noSession') })
      } else if (loading && !repo) {
        content = h(Skeleton)
      } else if (state.status === 'error') {
        content = h(
          'div',
          { className: 'gr-error', role: 'alert' },
          h('div', { className: 'gr-error-code' }, state.error.code),
          h('div', { className: 'gr-error-text' }, errorText(t, state.error)),
          h('button', { type: 'button', className: 'gr-text-button', onClick: refresh }, t('action.retry')),
        )
      } else if (repo) {
        const locals = repo.branches && Array.isArray(repo.branches.locals) ? repo.branches.locals : []
        const remotes = repo.branches && Array.isArray(repo.branches.remotes) ? repo.branches.remotes : []
        const commits = Array.isArray(repo.commits) ? repo.commits : []
        const selectedRef = scope.kind === 'branch' ? scope.ref : null
        const isBranchSelected = (branch) =>
          selectedRef !== null && (selectedRef === branch.refname || (selectedRef === 'HEAD' && branch.current))
        const selectBranch = (branch) => {
          if (!branch || !branch.refname) return
          setNotice(null)
          setScope({ kind: 'branch', ref: branch.refname })
        }

        content = [
          notice !== null
            ? h('div', { className: 'gr-inline-notice', role: 'status', key: 'notice' }, notice)
            : null,
          h(
            'div',
            { className: 'gr-status', key: 'status' },
            h(
              'span',
              { className: 'gr-branch-chip', title: repo.upstream || '' },
              h('span', { className: 'gr-chip-dot', 'aria-hidden': true }),
              repo.detached ? t('meta.detached') : repo.branch || t('meta.detached'),
            ),
            repo.unborn ? h('span', { className: 'gr-badge' }, t('meta.unborn')) : null,
            repo.changes > 0
              ? h('span', { className: 'gr-badge is-warn' }, `${repo.changes} ${t('meta.changes')}`)
              : null,
            repo.ahead > 0 ? h('span', { className: 'gr-badge', title: t('meta.ahead') }, `↑${repo.ahead}`) : null,
            repo.behind > 0 ? h('span', { className: 'gr-badge', title: t('meta.behind') }, `↓${repo.behind}`) : null,
          ),

          h(
            'section',
            { className: 'gr-section', key: 'branches' },
            h(
              'div',
              { className: 'gr-section-head' },
              h('span', null, t('section.branches')),
              h('span', { className: 'gr-count' }, String(locals.length)),
            ),
            locals.length === 0
              ? h('div', { className: 'gr-muted' }, repo.unborn ? t('state.unborn') : t('state.noBranches'))
              : h(
                  'div',
                  { className: 'gr-branch-list' },
                  locals.map((branch) =>
                    h(BranchRow, {
                      key: branch.name,
                      branch,
                      t,
                      selected: isBranchSelected(branch),
                      onSelect: selectBranch,
                    }),
                  ),
                ),
            remotes.length > 0
              ? h(
                  'details',
                  { className: 'gr-remotes' },
                  h(
                    'summary',
                    null,
                    h('span', null, t('section.remotes')),
                    h('span', { className: 'gr-count' }, String(remotes.length)),
                  ),
                  h(
                    'div',
                    { className: 'gr-branch-list' },
                    remotes.map((branch) =>
                      h(BranchRow, {
                        key: branch.name,
                        branch,
                        t,
                        selected: isBranchSelected(branch),
                        onSelect: selectBranch,
                      }),
                    ),
                  ),
                )
              : null,
          ),

          h(
            'section',
            { className: 'gr-section', key: 'commits' },
            h(
              'div',
              { className: 'gr-section-head gr-commits-head' },
              h(
                'div',
                { className: 'gr-commits-title' },
                h('span', null, t('section.commits')),
                h(ScopeMenu, {
                  t,
                  repo,
                  scope,
                  onChange: (next) => {
                    setNotice(null)
                    setScope(next)
                  },
                }),
              ),
              h('span', { className: 'gr-count' }, String(commits.length)),
            ),
            commits.length === 0
              ? h(Notice, {
                  title: repo.unborn
                    ? t('state.unborn')
                    : scope.kind === 'all'
                      ? t('scope.emptyAll')
                      : t('scope.emptyBranch'),
                  hint: repo.unborn ? t('state.unbornHint') : undefined,
                })
              : h(
                  'ol',
                  { className: 'gr-commits' },
                  commits.map((commit) => h(CommitRow, { key: commit.sha, commit, t })),
                ),
          ),
        ]
      } else {
        content = null
      }

      return h(
        'div',
        { className: 'gr-root' },
        h('style', { 'data-plugin': ID }, CSS),
        h(
          'header',
          { className: 'gr-head' },
          h(
            'div',
            { className: 'gr-brand' },
            h('span', { className: 'gr-logo' }, h(RailGlyph, { size: 16 })),
            h(
              'div',
              { className: 'gr-titles' },
              h('span', { className: 'gr-name' }, repo ? repo.name : t('app.title')),
              h(
                'span',
                { className: 'gr-path', title: repo ? repo.root : '' },
                repo ? repo.root : t('guide.description'),
              ),
            ),
          ),
          h(
            'button',
            {
              type: 'button',
              className: `gr-refresh${loading ? ' is-busy' : ''}`,
              onClick: refresh,
              disabled: loading || !sessionId,
              title: t('action.refresh'),
              'aria-label': t('action.refresh'),
            },
            h(RefreshGlyph),
          ),
        ),
        h(
          'div',
          { className: 'gr-body', 'aria-busy': loading ? 'true' : 'false' },
          loading && repo ? h('div', { className: 'gr-progress', 'aria-hidden': true }) : null,
          content,
        ),
        repo
          ? h(
              'footer',
              { className: 'gr-foot' },
              h('span', null, t('footer.readonly')),
              repo.head ? h('code', { className: 'gr-sha', title: repo.head }, repo.head) : null,
            )
          : null,
      )
    }

    const CSS = `
.gr-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  background: transparent;
}
.gr-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 9px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: none;
}
.gr-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.gr-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1);
  flex: none;
}
.gr-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}
.gr-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-path {
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-refresh {
  appearance: none;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.gr-refresh:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.gr-refresh:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.gr-refresh:disabled {
  opacity: 0.45;
  cursor: default;
}
.gr-refresh.is-busy svg {
  animation: gr-spin 1s linear infinite;
}
@keyframes gr-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .gr-refresh.is-busy svg { animation: none; }
}
.gr-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}
.gr-progress {
  position: sticky;
  top: 0;
  height: 2px;
  margin: -10px -12px 0;
  background: linear-gradient(90deg, transparent, var(--dsw-alias-brand-primary), transparent);
  animation: gr-slide 1.1s ease-in-out infinite;
}
@keyframes gr-slide {
  0% { opacity: 0.35; }
  50% { opacity: 1; }
  100% { opacity: 0.35; }
}
.gr-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: none;
}
.gr-branch-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-state-success-primary);
  flex: none;
}
.gr-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-1);
  white-space: nowrap;
}
.gr-badge.is-warn {
  color: var(--dsw-alias-state-warn-primary);
}
.gr-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.gr-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--dsw-alias-label-secondary);
}
.gr-count {
  font-weight: 400;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  opacity: 0.8;
}
.gr-commits-head {
  align-items: center;
}
.gr-commits-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.gr-scope-wrap {
  position: relative;
  min-width: 0;
}
.gr-scope-trigger {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 190px;
  padding: 1px 7px;
  border-radius: 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
}
.gr-scope-trigger:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.gr-scope-trigger:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.gr-scope-trigger:disabled {
  opacity: 0.5;
  cursor: default;
}
.gr-scope-trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gr-scope-caret {
  flex: none;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid var(--dsw-alias-label-secondary);
  transition: transform 0.15s ease;
}
.gr-scope-trigger[aria-expanded="true"] .gr-scope-caret {
  transform: rotate(180deg);
}
.gr-scope-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 30;
  min-width: 210px;
  max-width: 270px;
  max-height: 300px;
  overflow: auto;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  outline: none;
}
.gr-scope-group {
  padding: 7px 8px 3px;
  font-size: 9px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
  letter-spacing: 0.02em;
}
.gr-scope-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 5px;
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  line-height: 18px;
  cursor: pointer;
}
.gr-scope-option.is-active {
  background: var(--dsw-alias-bg-layer-1);
}
.gr-scope-option.is-selected {
  font-weight: 600;
}
.gr-scope-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gr-scope-check {
  margin-left: auto;
  flex: none;
  color: var(--dsw-alias-brand-primary);
  font-size: 10px;
}
.gr-inline-notice {
  padding: 7px 9px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-left: 3px solid var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 1.4;
}
.gr-branch-list {
  display: flex;
  flex-direction: column;
  max-height: 208px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
}
.gr-branch {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.gr-branch:hover {
  background: var(--dsw-alias-bg-layer-1);
}
.gr-branch:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.gr-branch + .gr-branch {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.gr-branch.is-current {
  background: var(--dsw-alias-bg-layer-1);
}
.gr-branch.is-scoped {
  background: var(--dsw-alias-bg-layer-2);
}
.gr-branch-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--dsw-alias-label-secondary);
}
.gr-branch.is-current .gr-branch-dot {
  background: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
}
.gr-branch-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.gr-branch-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-branch.is-current .gr-branch-name {
  font-weight: 600;
}
.gr-branch-up {
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-branch-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.gr-branch-check {
  color: var(--dsw-alias-brand-primary);
  font-size: 10px;
}
.gr-sha {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
}
.gr-remotes {
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  padding: 0;
}
.gr-remotes > summary {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  list-style: none;
}
.gr-remotes > summary .gr-count {
  margin-left: auto;
}
.gr-remotes > summary::before {
  content: "›";
  font-size: 12px;
  line-height: 1;
  color: var(--dsw-alias-label-secondary);
  transition: transform 0.15s ease;
}
.gr-remotes[open] > summary::before {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .gr-remotes > summary::before { transition: none; }
}
.gr-remotes > summary::-webkit-details-marker {
  display: none;
}
.gr-remotes[open] > summary {
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.gr-commits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.gr-commit {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 8px;
  padding: 5px 0;
}
.gr-rail {
  position: relative;
  display: block;
}
.gr-rail::before {
  content: "";
  position: absolute;
  left: 7px;
  top: -5px;
  bottom: -5px;
  width: 2px;
  background: var(--dsw-alias-brand-primary);
  opacity: 0.45;
}
.gr-commit:first-child .gr-rail::before {
  top: 11px;
}
.gr-commit:last-child .gr-rail::before {
  bottom: calc(100% - 11px);
}
.gr-dot {
  position: absolute;
  left: 3px;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  border: 2px solid var(--dsw-alias-brand-primary);
  z-index: 1;
}
.gr-commit-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.gr-subject {
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.gr-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
}
.gr-author {
  max-width: 10em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-refs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}
.gr-ref {
  max-width: 11em;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-ref.is-tag {
  color: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
}
.gr-notice {
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gr-notice-title {
  font-size: 12px;
  font-weight: 600;
}
.gr-notice-hint {
  font-size: 11px;
  line-height: 1.4;
  color: var(--dsw-alias-label-secondary);
}
.gr-error {
  border: 1px solid var(--dsw-alias-border-l1);
  border-left: 3px solid var(--dsw-alias-state-error-primary);
  border-radius: 8px;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--dsw-alias-bg-layer-1);
}
.gr-error-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 9px;
  color: var(--dsw-alias-state-error-primary);
}
.gr-error-text {
  font-size: 11px;
  line-height: 1.4;
}
.gr-text-button {
  appearance: none;
  align-self: flex-start;
  margin-top: 2px;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.gr-text-button:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.gr-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}
.gr-skeleton span {
  height: 10px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-1);
}
.gr-muted {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
.gr-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  border-top: 1px solid var(--dsw-alias-border-l1);
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
}
.gr-foot .gr-sha {
  flex: none;
}
`

    /* ================= plugin ================= */

    const inject = ['slots', 'locale', 'sidebarRightTabs']

    function apply(ctx) {
      const t = ctx.locale.bind(NS)

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'gitrail: dictionaries')

      ctx.effect(
        () =>
          ctx.sidebarRightTabs.register({
            id: ID,
            kind: KIND,
            priority: 'extension',
            title: () => t('type.label'),
            guide: [
              {
                id: 'repo',
                order: 40,
                title: () => t('guide.title'),
                description: () => t('guide.description'),
                icon: RailGlyph,
              },
            ],
          }),
        'gitrail: tab type',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.pane.tab', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.pane.tab',
                key: ID,
                locale: NS,
              },
              GitrailBody,
            ),
          ),
        'gitrail: tab body',
      )
    }

    return { inject, apply }
  },
})
