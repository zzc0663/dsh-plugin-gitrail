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
    const PANEL_ID = 'gitrail-graph'
    const NS = 'gitrail'
    const ENDPOINT = '/dsh-plugin-gitrail/repo'
    const ENDPOINT_COMMIT = '/dsh-plugin-gitrail/commit'

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
      'filter.local': '本地',
      'filter.remote': '远程',
      'filter.all': '全部',
      'filter.empty': '未选择任何分支',
      'filter.search': '搜索分支',
      'filter.noMatch': '没有匹配的分支',
      'search.placeholder': '搜索提交、作者、SHA',
      'search.label': '搜索提交',
      'search.empty': '没有匹配的提交',
      'search.loadingWindow': '在最近 500 条提交中搜索',
      'action.loadMore': '加载更多',
      'action.clearSearch': '清除搜索',
      'legend.title': '颜色 = 分支',
      'graph.merge': '合并',
      'graph.fork': '分叉点',
      'panel.label': 'Gitrail 图谱',
      'page.title': '图谱',
      'page.detail': '提交信息',
      'page.selectCommit': '选择一个提交查看信息',
      'page.empty': '请先选择一个会话',
      'page.sha': '提交',
      'page.author': '作者',
      'page.date': '时间',
      'page.parents': '父提交',
      'page.refs': '引用',
      'page.diffLater': 'diff / stat 预览将在 M2 提供。',
      'page.files': '改动文件',
      'page.message': '提交说明',
      'page.filesTruncated': '文件列表已截断',
      'page.bodyTruncated': '提交说明已截断',
      'page.patchUnavailable': 'diff 不可用。',
      'page.diff': 'diff',
      'page.diffTruncated': 'diff 已截断（512 KiB）',
      'page.binary': '二进制',
      'page.loadingDetail': '正在读取提交详情…',
      'error.commitNotFound': '提交不存在或已被移除。',
      'action.openPanel': '全宽打开图谱',
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
      'filter.local': 'Local',
      'filter.remote': 'Remote',
      'filter.all': 'All',
      'filter.empty': 'No branches selected',
      'filter.search': 'Search branches',
      'filter.noMatch': 'No matching branches',
      'search.placeholder': 'Search message, author, SHA',
      'search.label': 'Search commits',
      'search.empty': 'No matching commits',
      'search.loadingWindow': 'Searching the latest 500 commits',
      'action.loadMore': 'Load more',
      'action.clearSearch': 'Clear search',
      'legend.title': 'Color = branch',
      'graph.merge': 'Merge',
      'graph.fork': 'Branch point',
      'panel.label': 'Gitrail Graph',
      'page.title': 'Graph',
      'page.detail': 'Commit info',
      'page.selectCommit': 'Select a commit to inspect it',
      'page.empty': 'Select a session first',
      'page.sha': 'Commit',
      'page.author': 'Author',
      'page.date': 'Date',
      'page.parents': 'Parents',
      'page.refs': 'Refs',
      'page.diffLater': 'diff / stat preview arrives in M2.',
      'page.files': 'Changed files',
      'page.message': 'Commit message',
      'page.filesTruncated': 'File list truncated',
      'page.bodyTruncated': 'Commit message truncated',
      'page.patchUnavailable': 'diff unavailable.',
      'page.diff': 'diff',
      'page.diffTruncated': 'diff truncated (512 KiB)',
      'page.binary': 'binary',
      'page.loadingDetail': 'Reading commit…',
      'error.commitNotFound': 'This commit no longer exists.',
      'action.openPanel': 'Open full graph',
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

    function ExpandGlyph() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 14, height: 14, fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('path', {
          d: 'M6 2H2v4M10 2h4v4M14 10v4h-4M2 10v4h4',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    }

    /* ================= data ================= */

    function useRepo(sessionId, filter, nonce, limit = 80) {
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

        const params = new URLSearchParams({ session: sessionId, limit: String(limit) })
        if (filter) {
          params.set('scope', 'refs')
          for (const ref of filter.locals) params.append('local', ref)
          for (const ref of filter.remotes) params.append('remote', ref)
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
      }, [sessionId, filter, nonce, limit])

      return state
    }

    function createSelectionStore() {
      let value = null
      const listeners = new Set()
      const emit = () => {
        for (const listener of listeners) listener()
      }
      return {
        getSnapshot: () => value,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
        select: (sessionId, sha) => {
          if (value && value.sessionId === sessionId && value.sha === sha) return
          value = { sessionId, sha }
          emit()
        },
        clear: () => {
          if (value === null) return
          value = null
          emit()
        },
      }
    }

    const VIEW_STORE_KEY = 'dsh-plugin-gitrail:view:v1'

    function normalizeFilterValue(value) {
      if (!value || typeof value !== 'object') return null
      const clean = (list) => {
        if (!Array.isArray(list)) return []
        return Array.from(
          new Set(
            list.filter((item) => typeof item === 'string' && item !== '').slice(0, 100),
          ),
        )
      }
      return { locals: clean(value.locals), remotes: clean(value.remotes) }
    }

    function sameFilter(a, b) {
      if (a === null || b === null) return a === b
      return (
        a.locals.length === b.locals.length &&
        a.remotes.length === b.remotes.length &&
        a.locals.every((ref, index) => ref === b.locals[index]) &&
        a.remotes.every((ref, index) => ref === b.remotes[index])
      )
    }

    function createViewStore() {
      const filters = new Map()
      const cache = new Map()
      const listeners = new Set()
      const storage = typeof localStorage === 'undefined' ? null : localStorage

      try {
        const raw = storage ? storage.getItem(VIEW_STORE_KEY) : null
        const saved = raw ? JSON.parse(raw) : null
        if (saved && typeof saved === 'object') {
          for (const [sessionId, value] of Object.entries(saved)) {
            const filter = normalizeFilterValue(value)
            if (filter) filters.set(sessionId, filter)
          }
        }
      } catch {
        /* a corrupt or unavailable preference store must not break the panel */
      }

      const emit = () => {
        for (const listener of listeners) listener()
      }
      const persist = () => {
        if (!storage) return
        try {
          const payload = {}
          for (const [sessionId, filter] of Array.from(filters.entries()).slice(-20)) {
            payload[sessionId] = filter
          }
          storage.setItem(VIEW_STORE_KEY, JSON.stringify(payload))
        } catch {
          /* localStorage can be full or disabled */
        }
      }

      return {
        getSnapshot: (sessionId) => {
          if (!sessionId) return null
          if (!cache.has(sessionId)) cache.set(sessionId, filters.get(sessionId) || null)
          return cache.get(sessionId)
        },
        set: (sessionId, next) => {
          if (!sessionId) return
          const filter = normalizeFilterValue(next)
          const previous = cache.has(sessionId) ? cache.get(sessionId) : filters.get(sessionId) || null
          if (sameFilter(previous, filter)) return
          cache.set(sessionId, filter)
          if (filter) filters.set(sessionId, filter)
          else filters.delete(sessionId)
          persist()
          emit()
        },
        subscribe: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      }
    }

    function branchColorIndex(name, remote) {
      return laneColor(remote ? remoteColorKey(name) : name)
    }

    function branchRefs(repo, remote) {
      if (!repo || !repo.branches) return []
      const list = remote ? repo.branches.remotes : repo.branches.locals
      return Array.isArray(list) ? list.map((branch) => branch.refname).filter(Boolean) : []
    }

    function selectedFilterRefs(filter, repo, remote) {
      if (!filter) return branchRefs(repo, remote)
      return remote ? filter.remotes : filter.locals
    }

    function toggleFilterItem(filter, repo, remote, refname) {
      const all = branchRefs(repo, remote)
      const selected = filter ? selectedFilterRefs(filter, repo, remote) : all
      const next = selected.includes(refname) ? selected.filter((ref) => ref !== refname) : [...selected, refname]
      return remote
        ? { locals: filter ? filter.locals : branchRefs(repo, false), remotes: next }
        : { locals: next, remotes: filter ? filter.remotes : branchRefs(repo, true) }
    }

    function toggleFilterAll(filter, repo, remote) {
      const all = branchRefs(repo, remote)
      const selected = filter ? selectedFilterRefs(filter, repo, remote) : all
      const next = selected.length === all.length ? [] : all
      return remote
        ? { locals: filter ? filter.locals : branchRefs(repo, false), remotes: next }
        : { locals: next, remotes: filter ? filter.remotes : branchRefs(repo, true) }
    }

    function commitMatches(commit, query) {
      const needle = String(query || '').trim().toLowerCase()
      if (needle === '') return true
      if (!commit) return false
      const refs = Array.isArray(commit.refs) ? commit.refs : []
      const haystack = [
        commit.subject,
        commit.author,
        commit.email,
        commit.sha,
        commit.short,
        ...refs,
      ]
        .filter(Boolean)
        .join('\n')
        .toLowerCase()
      return haystack.includes(needle)
    }

    function useAutoRefresh(refresh) {
      const refreshRef = React.useRef(refresh)
      refreshRef.current = refresh
      React.useEffect(() => {
        let timer = null
        const schedule = () => {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
          if (timer !== null) clearTimeout(timer)
          timer = setTimeout(() => {
            timer = null
            refreshRef.current()
          }, 800)
        }
        window.addEventListener('focus', schedule)
        document.addEventListener('visibilitychange', schedule)
        return () => {
          if (timer !== null) clearTimeout(timer)
          window.removeEventListener('focus', schedule)
          document.removeEventListener('visibilitychange', schedule)
        }
      }, [])
    }

    function fileAddressFor(sessionId, cwd, root, file) {      const normalize = (value) => String(value || '').replace(/\\/g, '/').replace(/\/+$/, '')
      const absolute = `${normalize(root)}/${String(file || '').replace(/\\/g, '/')}`
      const workspace = normalize(cwd)
      const relative = workspace && absolute.startsWith(`${workspace}/`) ? absolute.slice(workspace.length + 1) : absolute
      const encoded = relative.split('/').map((segment) => encodeURIComponent(segment)).join('/')
      return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${encoded}`
    }

    function useCommitDetail(sessionId, sha) {
      const [state, setState] = React.useState({ status: 'idle', data: null, error: null, sha: null })

      React.useEffect(() => {
        if (!sessionId || !sha) {
          setState({ status: 'idle', data: null, error: null, sha: null })
          return undefined
        }
        const controller = new AbortController()
        let alive = true
        setState((previous) => ({
          status: 'loading',
          data: previous.sha === sha ? previous.data : null,
          error: null,
          sha,
        }))

        fetch(`${ENDPOINT_COMMIT}?session=${encodeURIComponent(sessionId)}&sha=${encodeURIComponent(sha)}`, {
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
            if (alive) setState({ status: 'ready', data: body, error: null, sha })
          })
          .catch((error) => {
            if (!alive || (error && error.name === 'AbortError')) return
            setState({
              status: 'error',
              data: null,
              error: { code: (error && error.code) || 'network/failed', message: (error && error.message) || '' },
              sha,
            })
          })

        return () => {
          alive = false
          controller.abort()
        }
      }, [sessionId, sha])

      return state
    }

    function diffLineClass(line) {
      if (line.startsWith('@@')) return 'is-hunk'
      if (line.startsWith('+++') || line.startsWith('---')) return 'is-file'
      if (
        line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('new file') ||
        line.startsWith('deleted file') ||
        line.startsWith('rename ') ||
        line.startsWith('similarity ')
      ) {
        return 'is-meta'
      }
      if (line.startsWith('+')) return 'is-add'
      if (line.startsWith('-')) return 'is-del'
      return ''
    }

    function DiffView(props) {
      const patch = typeof props.patch === 'string' ? props.patch : ''
      if (props.unavailable) return h('div', { className: 'gr-muted' }, props.t('page.patchUnavailable'))
      if (patch === '') return null
      const lines = patch.split(/\r?\n/)
      const shown = lines.slice(0, 4000)
      return h(
        'div',
        { className: 'gr-diff-wrap' },
        h('div', { className: 'gr-detail-section-head' }, props.t('page.diff')),
        h(
          'pre',
          { className: 'gr-diff' },
          shown.map((line, index) =>
            h('span', { key: index, className: `gr-diff-line ${diffLineClass(line)}` }, line || ' '),
          ),
        ),
        props.truncated || lines.length > shown.length
          ? h('div', { className: 'gr-detail-note' }, props.t('page.diffTruncated'))
          : null,
      )
    }

    function FileRow(props) {
      const file = props.file
      const label = file.oldPath ? `${file.oldPath} → ${file.path}` : file.path
      const content = [
        h('span', { className: 'gr-file-path', key: 'path', title: label }, file.path),
        h(
          'span',
          { className: 'gr-file-stat', key: 'stat' },
          file.binary ? props.t('page.binary') : `+${file.additions} −${file.deletions}`,
        ),
      ]
      if (typeof props.onOpen === 'function') {
        return h(
          'button',
          {
            type: 'button',
            className: 'gr-file-row',
            onClick: props.onOpen,
            title: file.oldPath ? `${file.oldPath} → ${file.path}` : file.path,
          },
          content,
        )
      }
      return h('div', { className: 'gr-file-row', title: label }, content)
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

    function formatFullDate(iso) {
      const time = Date.parse(iso)
      if (!Number.isFinite(time)) return iso || ''
      try {
        return new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      } catch {
        return new Date(time).toLocaleString()
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
        case 'git/commit-not-found':
          return t('error.commitNotFound')
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

    const LANE_COLORS = 8

    function laneColor(key) {
      const text = String(key || '')
      let hash = 0
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) | 0
      }
      return Math.abs(hash) % LANE_COLORS
    }

    function remoteColorKey(name) {
      const slash = name.indexOf('/')
      return slash === -1 ? name : name.slice(slash + 1)
    }

    /**
     * Lay out a colored commit graph. Pure function: newest-first commits in,
     * per-row segments/edges/nodes out. No DOM and no React.
     */
    function layoutGraph(commits, branches, options = {}) {
      const rowHeight = options.rowHeight || 64
      const laneGap = options.laneGap || 14
      const pad = options.pad || 10
      const list = Array.isArray(commits) ? commits : []
      const locals = branches && Array.isArray(branches.locals) ? branches.locals : []
      const remotes = branches && Array.isArray(branches.remotes) ? branches.remotes : []

      const tipBySha = new Map()
      const addTip = (branch, remote) => {
        if (!branch || typeof branch.sha !== 'string' || branch.sha === '') return
        const name = branch.name || branch.refname || branch.sha
        const tip = {
          name,
          refname: branch.refname || '',
          remote,
          current: Boolean(branch.current),
          color: laneColor(remote ? remoteColorKey(name) : name),
        }
        const tips = tipBySha.get(branch.sha) || []
        tips.push(tip)
        tipBySha.set(branch.sha, tips)
      }
      locals.forEach((branch) => addTip(branch, false))
      remotes.forEach((branch) => addTip(branch, true))
      const pickTip = (sha) => {
        const choose = (tips) =>
          tips.find((tip) => tip.current) || tips.find((tip) => !tip.remote) || tips[0]
        const exact = tipBySha.get(sha)
        if (exact && exact.length > 0) return choose(exact)
        for (const [short, tips] of tipBySha) {
          if (sha.startsWith(short)) return choose(tips)
        }
        return undefined
      }

      const rowOf = new Map()
      list.forEach((commit, index) => {
        if (commit && typeof commit.sha === 'string') rowOf.set(commit.sha, index)
      })
      const children = new Map()
      for (const commit of list) {
        for (const parent of commit.parents || []) children.set(parent, (children.get(parent) || 0) + 1)
      }

      const active = []
      const nodes = []
      const segments = []
      const edges = []
      const legend = []
      const legendSeen = new Set()
      let maxLane = 0

      const xOf = (lane) => pad + lane * laneGap
      const noteLane = (label, color, remote) => {
        if (!label || legendSeen.has(label)) return
        legendSeen.add(label)
        legend.push({ label, color, remote })
      }
      const firstFree = (start) => {
        for (let index = start; index < active.length; index += 1) {
          if (active[index] === null || active[index] === undefined) return index
        }
        return active.length
      }

      for (let row = 0; row < list.length; row += 1) {
        const commit = list[row]
        if (!commit || typeof commit.sha !== 'string') continue
        const yTop = row * rowHeight
        const y = yTop + rowHeight / 2
        const yBottom = yTop + rowHeight

        const targetLanes = []
        for (let index = 0; index < active.length; index += 1) {
          if (active[index] && active[index].sha === commit.sha) targetLanes.push(index)
        }
        let lane = targetLanes[0]
        if (lane === undefined) lane = firstFree(0)
        const expected = active[lane]
        const tip = pickTip(commit.sha)
        const tipKey = tip ? (tip.remote ? remoteColorKey(tip.name) : tip.name) : undefined
        const expectedKey = expected ? (expected.remote ? remoteColorKey(expected.label) : expected.label) : undefined
        const handoff = Boolean(expected && tip && expectedKey !== tipKey)
        const color = handoff || !expected ? (tip ? tip.color : laneColor(commit.sha)) : expected.color
        const remote = handoff || !expected ? (tip ? tip.remote : false) : expected.remote
        const label = handoff || !expected ? (tip ? tip.name : undefined) : expected.label
        const nodeTip = tip ? { name: tip.name, color: tip.color, remote: tip.remote } : undefined

        for (let index = 0; index < active.length; index += 1) {
          const state = active[index]
          if (!state) continue
          const isTarget = targetLanes.includes(index)
          if (index === lane) {
            segments.push({ x1: xOf(index), y1: yTop, x2: xOf(index), y2: y, color: state.color, remote: state.remote })
          } else {
            segments.push({
              x1: xOf(index),
              y1: yTop,
              x2: xOf(index),
              y2: isTarget ? y : yBottom,
              color: state.color,
              remote: state.remote,
            })
            if (isTarget) {
              edges.push({
                x1: xOf(index),
                y1: y,
                x2: xOf(lane),
                y2: y,
                color: state.color,
                dashed: state.remote,
                dangling: false,
                kind: 'join',
              })
            }
          }
        }

        active[lane] = null
        for (const duplicate of targetLanes) {
          if (duplicate !== lane) active[duplicate] = null
        }

        const parentTargets = []
        const parents = Array.isArray(commit.parents) ? commit.parents : []
        for (let parentIndex = 0; parentIndex < parents.length; parentIndex += 1) {
          const parentSha = parents[parentIndex]
          const visible = rowOf.has(parentSha)
          let target = parentIndex === 0 && visible ? lane : active.findIndex((state) => state && state.sha === parentSha)
          if (target === -1) {
            target = parentIndex === 0 ? lane : firstFree(lane + 1)
          }
          const parentTip = pickTip(parentSha)
          const targetState = active[target]
          const parentLabel =
            parentIndex === 0
              ? (targetState && targetState.label) || label || (parentTip && parentTip.name)
              : (parentTip && parentTip.name) || (targetState && targetState.label)
          const parentColor =
            parentIndex === 0
              ? (targetState && targetState.color) || color
              : (parentTip && parentTip.color) || (targetState && targetState.color) || laneColor(parentSha)
          const parentRemote =
            parentIndex === 0
              ? targetState
                ? targetState.remote
                : remote
              : parentTip
                ? parentTip.remote
                : targetState
                  ? targetState.remote
                  : false
          if (visible && (!active[target] || active[target].sha !== parentSha)) {
            active[target] = { sha: parentSha, color: parentColor, label: parentLabel, remote: parentRemote }
          }
          parentTargets.push({
            parentIndex,
            parentSha,
            target,
            visible,
            color: parentColor,
            remote: parentRemote,
            label: parentLabel,
          })
          if (parentLabel) noteLane(parentLabel, parentColor, parentRemote)
          maxLane = Math.max(maxLane, target, lane)
        }
        maxLane = Math.max(maxLane, lane)

        for (const parent of parentTargets) {
          edges.push({
            x1: xOf(lane),
            y1: y,
            x2: xOf(parent.target),
            y2: yBottom,
            color: parent.color,
            dashed: parent.parentIndex > 0 || parent.remote,
            dangling: !parent.visible,
            kind: parent.parentIndex === 0 ? 'first' : 'merge',
          })
        }

        const merge = parents.length > 1
        nodes.push({
          sha: commit.sha,
          row,
          lane,
          x: xOf(lane),
          y,
          color,
          remote,
          label,
          tip: nodeTip,
          merge,
          fork: (children.get(commit.sha) || 0) > 1,
          head: (commit.refs || []).some((ref) => ref.startsWith('HEAD')),
          mergeTarget: merge ? parentTargets[0] && parentTargets[0].label : undefined,
          mergeSource: merge ? parentTargets[1] && parentTargets[1].label : undefined,
        })
        if (label) noteLane(label, color, remote)
        if (tip) noteLane(tip.name, tip.color, tip.remote)
      }

      /* A branch tip can point at an ancestor of another selected tip (for
       * example `main` behind `develop`). Commit topology alone then paints a
       * single vertical lane. Give the newer branch its own rail and connect it
       * to the older tip with a diagonal edge, which reads as "branch created
       * here" instead of a straight line. */
      const tipRows = []
      for (const [sha, tips] of tipBySha) {
        let row = rowOf.get(sha)
        if (row === undefined) {
          for (const [fullSha, index] of rowOf) {
            if (fullSha.startsWith(sha)) {
              row = index
              break
            }
          }
        }
        if (row !== undefined) tipRows.push({ row, sha: list[row].sha, tips })
      }
      const tipRowSet = new Set(tipRows.map((tip) => tip.row))
      const childMap = new Map()
      for (const commit of list) {
        for (const parent of commit.parents || []) {
          const kids = childMap.get(parent) || []
          kids.push(commit.sha)
          childMap.set(parent, kids)
        }
      }
      const ancestors = (startSha) => {
        const seen = new Set()
        const rows = new Set()
        const stack = [startSha]
        while (stack.length > 0) {
          const sha = stack.pop()
          if (!sha || seen.has(sha)) continue
          seen.add(sha)
          const row = rowOf.get(sha)
          if (row !== undefined) rows.add(row)
          const commit = row === undefined ? undefined : list[row]
          for (const parent of (commit && commit.parents) || []) stack.push(parent)
        }
        return rows
      }
      let behindTip
      for (const tip of tipRows) {
        if (tip.row < 1) continue
        for (const other of tipRows) {
          if (other.row >= tip.row) continue
          if (ancestors(other.sha).has(tip.row)) {
            behindTip = tip
            break
          }
        }
        if (behindTip) break
      }
      if (behindTip) {
        const behindNode = nodes.find((node) => node.row === behindTip.row)
        const children = childMap.get(behindTip.sha) || []
        if (behindNode && children.length === 1) {
          const chain = []
          let cursor = children[0]
          let targetRow = null
          while (cursor) {
            const row = rowOf.get(cursor)
            if (row === undefined) break
            const commit = list[row]
            if ((commit.parents || []).length > 1) {
              chain.length = 0
              break
            }
            chain.push(row)
            if (tipRowSet.has(row) && row !== behindTip.row) {
              targetRow = row
              break
            }
            const kids = childMap.get(cursor) || []
            if (kids.length !== 1) break
            cursor = kids[0]
          }
          if (targetRow !== null && chain.length > 0) {
            const oldLane = behindNode.lane
            const oldX = xOf(oldLane)
            const railLane = maxLane + 1
            const railX = xOf(railLane)
            const chainSet = new Set(chain)
            const spanTop = Math.min(...chain) * rowHeight
            const spanBottom = (Math.max(...chain) + 1) * rowHeight
            const linear = chain.every((row) => {
              const node = nodes.find((candidate) => candidate.row === row)
              return node && node.lane === oldLane
            })
            if (linear) {
              for (const node of nodes) {
                if (chainSet.has(node.row)) {
                  node.lane = railLane
                  node.x = railX
                }
              }
              for (const segment of segments) {
                if (
                  segment.x1 === oldX &&
                  segment.x2 === oldX &&
                  segment.y1 >= spanTop - 0.01 &&
                  segment.y2 <= spanBottom + 0.01
                ) {
                  segment.x1 = railX
                  segment.x2 = railX
                }
              }
              for (const edge of edges) {
                if (edge.x1 === oldX && edge.y1 >= spanTop - 0.01 && edge.y1 <= spanBottom + 0.01) {
                  edge.x1 = railX
                }
                if (
                  edge.x2 === oldX &&
                  edge.y2 >= spanTop - 0.01 &&
                  edge.y2 < spanBottom - 0.01
                ) {
                  edge.x2 = railX
                }
              }
              maxLane = Math.max(maxLane, railLane)
            }
          }
        }
      }

      const laneCount = Math.max(1, maxLane + 1)
      return {        rowHeight,
        width: pad * 2 + (laneCount - 1) * laneGap,
        height: list.length * rowHeight,
        laneCount,
        nodes,
        segments,
        edges,
        legend,
      }
    }

    function laneStroke(index) {
      return `var(--gr-lane-${(index % LANE_COLORS) + 1})`
    }

    function GraphSvg(props) {
      const graph = props.graph
      const parts = []

      graph.segments.forEach((segment, index) => {
        parts.push(
          h('line', {
            key: `segment-${index}`,
            x1: segment.x1,
            y1: segment.y1,
            x2: segment.x2,
            y2: segment.y2,
            stroke: laneStroke(segment.color),
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeDasharray: segment.remote ? '4 3' : undefined,
            opacity: segment.remote ? 0.72 : 1,
          }),
        )
      })

      graph.edges.forEach((edge, index) => {
        const span = edge.y2 - edge.y1
        const path =
          edge.x1 === edge.x2
            ? `M${edge.x1},${edge.y1}L${edge.x2},${edge.y2}`
            : `M${edge.x1},${edge.y1}C${edge.x1},${edge.y1 + span * 0.45} ${edge.x2},${
                edge.y2 - span * 0.45
              } ${edge.x2},${edge.y2}`
        parts.push(
          h('path', {
            key: `edge-${index}`,
            d: path,
            fill: 'none',
            stroke: laneStroke(edge.color),
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeDasharray: edge.dashed ? '3 3' : undefined,
            opacity: edge.remote ? 0.72 : 1,
          }),
        )
        if (edge.dangling) {
          parts.push(
            h('circle', {
              key: `dangling-${index}`,
              cx: edge.x2,
              cy: edge.y2 - 2,
              r: 3,
              fill: 'none',
              stroke: laneStroke(edge.color),
              strokeWidth: 1.5,
              strokeDasharray: '2 2',
            }),
          )
        }
      })

      graph.nodes.forEach((node) => {
        const color = laneStroke(node.color)
        const opacity = node.remote ? 0.72 : 1
        if (node.head) {
          parts.push(
            h('circle', {
              key: `halo-${node.sha}`,
              cx: node.x,
              cy: node.y,
              r: 9,
              fill: 'none',
              stroke: color,
              strokeWidth: 1,
              opacity: 0.35,
            }),
          )
        }
        if (node.merge) {
          parts.push(
            h('circle', {
              key: `ring-${node.sha}`,
              cx: node.x,
              cy: node.y,
              r: 7,
              fill: 'none',
              stroke: color,
              strokeWidth: 1.6,
              opacity,
            }),
          )
          parts.push(h('circle', { key: `node-${node.sha}`, cx: node.x, cy: node.y, r: 3.2, fill: color, opacity }))
        } else if (node.fork) {
          parts.push(
            h('rect', {
              key: `node-${node.sha}`,
              x: node.x - 4,
              y: node.y - 4,
              width: 8,
              height: 8,
              transform: `rotate(45 ${node.x} ${node.y})`,
              fill: color,
              opacity,
            }),
          )
        } else {
          parts.push(h('circle', { key: `node-${node.sha}`, cx: node.x, cy: node.y, r: 4, fill: color, opacity }))
        }
      })

      return h(
        'svg',
        {
          className: 'gr-graph',
          width: graph.width,
          height: graph.height,
          viewBox: `0 0 ${graph.width} ${graph.height}`,
          'aria-hidden': true,
        },
        parts,
      )
    }

    function GraphLegend(props) {
      const legend = props.legend
      if (!Array.isArray(legend) || legend.length < 2) return null
      return h(
        'details',
        { className: 'gr-legend' },
        h(
          'summary',
          null,
          h('span', null, props.t('legend.title')),
          h('span', { className: 'gr-count' }, String(legend.length)),
        ),
        h(
          'div',
          { className: 'gr-legend-items' },
          legend.map((item) =>
            h(
              'span',
              { key: item.label, className: 'gr-legend-item', title: item.remote ? `${item.label} (remote)` : item.label },
              h('span', {
                className: 'gr-legend-dot',
                'aria-hidden': true,
                style: { background: laneStroke(item.color), opacity: item.remote ? 0.6 : 1 },
              }),
              item.label,
            ),
          ),
        ),
      )
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
        const menu = listRef.current
        if (!element || !menu) return
        const top = element.offsetTop
        const bottom = top + element.offsetHeight
        if (top < menu.scrollTop) menu.scrollTop = top
        else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight
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

    let multiMenuSeq = 0

    function SearchBox(props) {
      const value = props.value || ''
      return h(
        'div',
        { className: `gr-search${value ? ' has-value' : ''}` },
        h(
          'svg',
          { viewBox: '0 0 16 16', width: 12, height: 12, fill: 'none', 'aria-hidden': true },
          h('circle', { cx: 7, cy: 7, r: 4.5, stroke: 'currentColor', strokeWidth: 1.4 }),
          h('path', { d: 'M10.5 10.5 14 14', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        ),
        h('input', {
          type: 'search',
          value,
          placeholder: props.t('search.placeholder'),
          'aria-label': props.t('search.label'),
          onChange: (event) => props.onChange(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              props.onChange('')
            }
          },
        }),
        value
          ? h(
              'button',
              {
                type: 'button',
                className: 'gr-search-clear',
                onClick: () => props.onChange(''),
                title: props.t('action.clearSearch'),
                'aria-label': props.t('action.clearSearch'),
              },
              '×',
            )
          : null,
      )
    }

    function BranchMultiMenu(props) {
      const t = props.t
      const label = props.label
      const branches = Array.isArray(props.branches) ? props.branches : []
      const selected = Array.isArray(props.selected) ? props.selected : []
      const remote = Boolean(props.remote)
      const [open, setOpen] = React.useState(false)
      const [active, setActive] = React.useState(0)
      const [query, setQuery] = React.useState('')
      const wrapRef = React.useRef(null)
      const listRef = React.useRef(null)
      const inputRef = React.useRef(null)
      const triggerRef = React.useRef(null)
      const optionRefs = React.useRef([])
      const listId = React.useMemo(() => `gr-multi-${++multiMenuSeq}`, [])
      const refs = branches.map((branch) => branch.refname).filter(Boolean)
      const selectedSet = new Set(selected)
      const allSelected = refs.length > 0 && refs.every((ref) => selectedSet.has(ref))
      const needle = query.trim().toLowerCase()
      const filtered = needle
        ? branches.filter((branch) => (branch.name || '').toLowerCase().includes(needle))
        : branches
      const options = [
        ...(needle ? [] : [{ key: '__all__', label: t('filter.all'), all: true }]),
        ...filtered.map((branch) => ({ key: branch.refname, label: branch.name, all: false })),
      ]

      const close = (focusTrigger) => {
        setOpen(false)
        if (focusTrigger && triggerRef.current !== null) triggerRef.current.focus()
      }

      const toggle = (option) => {
        if (option.all) {
          props.onChange(allSelected ? [] : refs)
          return
        }
        const next = selectedSet.has(option.key)
          ? selected.filter((ref) => ref !== option.key)
          : [...selected, option.key]
        props.onChange(next)
      }

      React.useEffect(() => {
        if (!open) return undefined
        const onDocumentMouseDown = (event) => {
          if (wrapRef.current !== null && !wrapRef.current.contains(event.target)) close(false)
        }
        document.addEventListener('mousedown', onDocumentMouseDown)
        setActive(0)
        const raf = requestAnimationFrame(() => {
          if (inputRef.current !== null) inputRef.current.focus()
        })
        return () => {
          document.removeEventListener('mousedown', onDocumentMouseDown)
          cancelAnimationFrame(raf)
        }
      }, [open])

      React.useEffect(() => {
        if (!open) return
        const element = optionRefs.current[active]
        const menu = listRef.current
        if (!element || !menu) return
        const top = element.offsetTop
        const bottom = top + element.offsetHeight
        if (top < menu.scrollTop) menu.scrollTop = top
        else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight
      }, [open, active])

      const onKeyDown = (event, fromInput = false) => {
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
          if (options.length > 0) setActive((value) => (value + 1) % options.length)
          return
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          if (options.length > 0) setActive((value) => (value - 1 + options.length) % options.length)
          return
        }
        if (event.key === 'Home') {
          event.preventDefault()
          setActive(0)
          return
        }
        if (event.key === 'End') {
          event.preventDefault()
          setActive(Math.max(0, options.length - 1))
          return
        }
        if (event.key === 'Enter' || (event.key === ' ' && !fromInput)) {
          event.preventDefault()
          if (options[active]) toggle(options[active])
        }
      }

      React.useEffect(() => {
        if (!open) setQuery('')
      }, [open])

      const rows = options.map((option, index) => {
        const checked = option.all ? allSelected : selectedSet.has(option.key)
        return h(
          'div',
          {
            key: option.key,
            id: `${listId}-${index}`,
            ref: (element) => {
              optionRefs.current[index] = element
            },
            role: 'option',
            'aria-selected': checked,
            className: `gr-scope-option${index === active ? ' is-active' : ''}${checked ? ' is-selected' : ''}`,
            onMouseEnter: () => setActive(index),
            onClick: () => toggle(option),
          },
          h('span', { className: 'gr-scope-option-label' }, option.label),
          checked ? h('span', { className: 'gr-scope-check', 'aria-hidden': true }, '✓') : null,
        )
      })

      const triggerLabel = allSelected ? t('filter.all') : `${selected.length}/${refs.length}`

      return h(
        'div',
        { className: 'gr-scope-wrap', ref: wrapRef },
        h(
          'button',
          {
            type: 'button',
            ref: triggerRef,
            className: 'gr-scope-trigger',
            disabled: refs.length === 0,
            'aria-haspopup': 'listbox',
            'aria-expanded': open,
            'aria-controls': open ? listId : undefined,
            'aria-label': `${label}: ${triggerLabel}`,
            title: `${label}: ${triggerLabel}`,
            onClick: () => setOpen((value) => !value),
            onKeyDown: (event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setOpen(true)
              }
            },
          },
          h('span', { className: 'gr-scope-trigger-label' }, `${label} ${triggerLabel}`),
          h('span', { className: 'gr-scope-caret', 'aria-hidden': true, style: open ? { transform: 'rotate(180deg)' } : undefined }),
        ),
        open
          ? h(
              'div',
              {
                className: 'gr-scope-menu',
                role: 'listbox',
                'aria-multiselectable': 'true',
                id: listId,
                tabIndex: -1,
                ref: listRef,
                'aria-label': label,
                'aria-activedescendant': options.length > 0 ? `${listId}-${active}` : undefined,
                onKeyDown,
              },
              h('input', {
                ref: inputRef,
                className: 'gr-scope-search',
                type: 'search',
                value: query,
                placeholder: t('filter.search'),
                'aria-label': t('filter.search'),
                onChange: (event) => {
                  setQuery(event.target.value)
                  setActive(0)
                },
                onKeyDown: (event) => {
                  event.stopPropagation()
                  onKeyDown(event, true)
                },
              }),
              rows.length > 0 ? rows : h('div', { className: 'gr-scope-empty' }, t('filter.noMatch')),
            )
          : null,
      )
    }

    function BranchRow(props) {
      const branch = props.branch
      const remote = Boolean(props.remote)
      const selected = Boolean(props.selected)
      const color = branchColorIndex(branch.name, remote)
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
        h('span', {
          className: 'gr-branch-dot',
          'aria-hidden': true,
          title: branch.name,
          style: {
            borderColor: laneStroke(color),
            borderStyle: remote ? 'dashed' : 'solid',
            background: branch.current ? laneStroke(color) : 'transparent',
            opacity: remote ? 0.7 : 1,
          },
        }),
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
      const node = props.node
      const t = props.t
      const refs = Array.isArray(commit.refs) ? commit.refs.slice(0, 4) : []
      const extra = Array.isArray(commit.refs) ? commit.refs.length - refs.length : 0
      const parents = Array.isArray(commit.parents) ? commit.parents : []
      const operation =
        node && node.merge
          ? node.mergeTarget && node.mergeSource
            ? `${t('graph.merge')}: ${node.mergeTarget} ← ${node.mergeSource}`
            : `${t('graph.merge')} (${parents.length})`
          : node && node.fork
            ? t('graph.fork')
            : ''
      const subject = commit.subject || t('commit.noSubject')
      const title = [commit.sha, `${commit.author} <${commit.email}>`, operation].filter(Boolean).join('\n')
      const selectable = typeof props.onSelect === 'function'
      const selected = Boolean(props.selected)

      return h(
        'li',
        {
          className: `gr-commit${selectable ? ' is-selectable' : ''}${selected ? ' is-selected' : ''}`,
          title,
          style: props.rowColor ? { '--gr-row-color': props.rowColor } : undefined,
          role: selectable ? 'button' : undefined,
          tabIndex: selectable ? 0 : undefined,
          'aria-current': selected ? 'true' : undefined,
          'aria-label': `${commit.short} ${subject}${operation ? `, ${operation}` : ''}`,
          onClick: selectable ? () => props.onSelect(commit.sha) : undefined,
          onKeyDown: selectable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  props.onSelect(commit.sha)
                }
              }
            : undefined,
        },
        h(
          'div',
          { className: 'gr-commit-body' },
          h(
            'div',
            { className: 'gr-subject-line' },
            node && node.tip
              ? h(
                  'span',
                  { className: 'gr-tip', style: { borderColor: laneStroke(node.tip.color), color: laneStroke(node.tip.color) } },
                  node.tip.name,
                )
              : null,
            h('div', { className: 'gr-subject' }, subject),
          ),
          h(
            'div',
            { className: 'gr-meta' },
            h('code', { className: 'gr-sha' }, commit.short),
            h('span', { className: 'gr-author' }, commit.author),
            h('span', { className: 'gr-time' }, timeAgo(commit.date)),
            node && node.merge
              ? h(
                  'span',
                  { className: 'gr-op', style: { borderColor: laneStroke(node.color) }, title: operation },
                  t('graph.merge'),
                )
              : node && node.fork
                ? h(
                    'span',
                    { className: 'gr-op', style: { borderColor: laneStroke(node.color) }, title: operation },
                    t('graph.fork'),
                  )
                : null,
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
      const openPanel = props.openPanel
      const selection = props.selection
      const viewStore = props.viewStore
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
      const [fallbackFilter, setFallbackFilter] = React.useState(null)
      const [remotesOpen, setRemotesOpen] = React.useState(true)
      const [notice, setNotice] = React.useState(null)
      const [limit, setLimit] = React.useState(80)
      const [search, setSearch] = React.useState('')
      const filter = React.useSyncExternalStore(
        React.useCallback(
          (callback) => (viewStore ? viewStore.subscribe(callback) : () => {}),
          [viewStore],
        ),
        React.useCallback(
          () => (viewStore ? viewStore.getSnapshot(sessionId) : fallbackFilter),
          [viewStore, sessionId, fallbackFilter],
        ),
        () => null,
      )
      const setFilter = (next) => {
        if (viewStore) viewStore.set(sessionId, next)
        else setFallbackFilter(next)
      }
      const state = useRepo(sessionId, filter, nonce, search.trim() ? 500 : limit)
      const repo = state.data
      const loading = state.status === 'loading'
      const searching = search.trim() !== ''
      const graph = React.useMemo(() => {
        if (searching || !repo || !Array.isArray(repo.commits) || repo.commits.length === 0) return null
        return layoutGraph(repo.commits, repo.branches, { laneGap: 18 })
      }, [repo, searching])
      const nodeBySha = graph ? new Map(graph.nodes.map((node) => [node.sha, node])) : null
      const refresh = () => {
        setNotice(null)
        setNonce((value) => value + 1)
      }
      const loadMore = () => setLimit((value) => Math.min(500, value + 100))
      useAutoRefresh(refresh)

      const sessionRef = React.useRef(sessionId)
      React.useEffect(() => {
        if (sessionRef.current === sessionId) return
        sessionRef.current = sessionId
        if (!viewStore) setFallbackFilter(null)
        setLimit(80)
        setSearch('')
        setNotice(null)
      }, [sessionId, viewStore])

      React.useEffect(() => {
        if (!state.error) return
        if (
          (state.error.code === 'git/unknown-ref' || state.error.code === 'request/bad-ref') &&
          filter !== null
        ) {
          setNotice(t('scope.missing'))
          setFilter(null)
        }
      }, [state.error, filter])

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
        const localRefs = branchRefs(repo, false)
        const remoteRefs = branchRefs(repo, true)
        const selectedLocals = selectedFilterRefs(filter, repo, false)
        const selectedRemotes = selectedFilterRefs(filter, repo, true)
        const commits = Array.isArray(repo.commits) ? repo.commits : []
        const visibleCommits = searching ? commits.filter((commit) => commitMatches(commit, search)) : commits
        const isLocalSelected = (branch) => filter !== null && selectedLocals.includes(branch.refname)
        const isRemoteSelected = (branch) => filter !== null && selectedRemotes.includes(branch.refname)
        const toggleBranch = (remote, branch) => {
          if (!branch || !branch.refname) return
          setNotice(null)
          setFilter(toggleFilterItem(filter, repo, remote, branch.refname))
        }
        const setGroup = (remote, next) => {
          setNotice(null)
          setFilter(
            remote
              ? { locals: filter ? filter.locals : localRefs, remotes: next }
              : { locals: next, remotes: filter ? filter.remotes : remoteRefs },
          )
        }
        const filterEmpty = filter !== null && selectedLocals.length === 0 && selectedRemotes.length === 0

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
                      remote: false,
                      selected: isLocalSelected(branch),
                      onSelect: (selectedBranch) => toggleBranch(false, selectedBranch),
                    }),
                  ),
                ),
            remotes.length > 0
              ? h(
                  'details',
                  {
                    className: 'gr-remotes',
                    open: remotesOpen,
                    onToggle: (event) => setRemotesOpen(event.currentTarget.open),
                  },
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
                        remote: true,
                        selected: isRemoteSelected(branch),
                        onSelect: (selectedBranch) => toggleBranch(true, selectedBranch),
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
                h(BranchMultiMenu, {
                  t,
                  label: t('filter.local'),
                  branches: locals,
                  selected: selectedLocals,
                  remote: false,
                  onChange: (next) => setGroup(false, next),
                }),
                h(BranchMultiMenu, {
                  t,
                  label: t('filter.remote'),
                  branches: remotes,
                  selected: selectedRemotes,
                  remote: true,
                  onChange: (next) => setGroup(true, next),
                }),
              ),
              h('span', { className: 'gr-count' }, searching ? `${visibleCommits.length}/${commits.length}` : String(commits.length)),
            ),
            h(SearchBox, { t, value: search, onChange: setSearch }),
            searching ? h('div', { className: 'gr-search-note' }, t('search.loadingWindow')) : null,
            searching ? null : h(GraphLegend, { legend: graph ? graph.legend : [], t }),
            visibleCommits.length === 0
              ? h(Notice, {
                  title: searching
                    ? t('search.empty')
                    : repo.unborn
                      ? t('state.unborn')
                      : filterEmpty
                        ? t('filter.empty')
                        : t('scope.emptyAll'),
                  hint: repo.unborn && !searching ? t('state.unbornHint') : undefined,
                })
              : h(
                  'div',
                  {
                    className: `gr-graph-wrap${searching ? ' is-plain' : ''}`,
                    style: graph ? { '--gr-graph-width': `${graph.width + 8}px` } : undefined,
                  },
                  graph ? h(GraphSvg, { graph }) : null,
                  h(
                    'ol',
                    { className: 'gr-commits' },
                    visibleCommits.map((commit) =>
                      h(CommitRow, {
                        key: commit.sha,
                        commit,
                        t,
                        node: nodeBySha ? nodeBySha.get(commit.sha) : undefined,
                        onSelect: (sha) => {
                          if (selection && typeof selection.select === 'function') selection.select(sessionId, sha)
                          if (typeof openPanel === 'function') openPanel()
                        },
                      }),
                    ),
                  ),
                ),
            !searching && commits.length >= limit && limit < 500
              ? h('button', { type: 'button', className: 'gr-text-button gr-load-more', onClick: loadMore }, t('action.loadMore'))
              : null,
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
          openPanel
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'gr-refresh',
                  onClick: openPanel,
                  title: t('action.openPanel'),
                  'aria-label': t('action.openPanel'),
                },
                h(ExpandGlyph),
              )
            : null,
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

    function GitrailPage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const sessions = props.sessions
      const selection = props.selection
      const openFile = props.openFile
      const viewStore = props.viewStore
      const subscribe = React.useCallback(
        (callback) => {
          if (!sessions || !sessions.list || typeof sessions.list.subscribe !== 'function') return () => {}
          return sessions.list.subscribe(callback)
        },
        [sessions],
      )
      const getSnapshot = React.useCallback(
        () => (sessions && sessions.list ? sessions.list.getSnapshot() : null),
        [sessions],
      )
      const list = React.useSyncExternalStore(subscribe, getSnapshot, () => null)
      const byId = list && list.byId ? list.byId : {}
      const ids = list && Array.isArray(list.ids) ? list.ids : Object.keys(byId)
      const sessionId =
        ids.find((id) => (byId[id] && byId[id].retainedBy && byId[id].retainedBy.mainView) > 0) || ids[0]

      const [fallbackFilter, setFallbackFilter] = React.useState(null)
      const [nonce, setNonce] = React.useState(0)
      const [selectedSha, setSelectedSha] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [limit, setLimit] = React.useState(80)
      const [search, setSearch] = React.useState('')
      const filter = React.useSyncExternalStore(
        React.useCallback(
          (callback) => (viewStore ? viewStore.subscribe(callback) : () => {}),
          [viewStore],
        ),
        React.useCallback(
          () => (viewStore ? viewStore.getSnapshot(sessionId) : fallbackFilter),
          [viewStore, sessionId, fallbackFilter],
        ),
        () => null,
      )
      const setFilter = (next) => {
        if (viewStore) viewStore.set(sessionId, next)
        else setFallbackFilter(next)
      }
      const selectionSnapshot = React.useSyncExternalStore(
        (callback) => (selection ? selection.subscribe(callback) : () => {}),
        () => (selection ? selection.getSnapshot() : null),
        () => null,
      )
      const state = useRepo(sessionId, filter, nonce, search.trim() ? 500 : limit)
      const repo = state.data
      const loading = state.status === 'loading'
      const localRefs = branchRefs(repo, false)
      const remoteRefs = branchRefs(repo, true)
      const selectedLocals = selectedFilterRefs(filter, repo, false)
      const selectedRemotes = selectedFilterRefs(filter, repo, true)
      const filterEmpty = filter !== null && selectedLocals.length === 0 && selectedRemotes.length === 0
      const setGroup = (remote, next) => {
        setNotice(null)
        setFilter(
          remote
            ? { locals: filter ? filter.locals : localRefs, remotes: next }
            : { locals: next, remotes: filter ? filter.remotes : remoteRefs },
        )
      }
      const detailState = useCommitDetail(sessionId, selectedSha)
      const detail = detailState.data
      const detailCommit = detail && detail.commit ? detail.commit : null
      const searching = search.trim() !== ''
      const graph = React.useMemo(() => {
        if (searching || !repo || !Array.isArray(repo.commits) || repo.commits.length === 0) return null
        return layoutGraph(repo.commits, repo.branches, { rowHeight: 64, laneGap: 26, pad: 16 })
      }, [repo, searching])
      const nodeBySha = graph ? new Map(graph.nodes.map((node) => [node.sha, node])) : null
      const commits = repo && Array.isArray(repo.commits) ? repo.commits : []
      const visibleCommits = searching ? commits.filter((commit) => commitMatches(commit, search)) : commits
      const selectedCommit = selectedSha ? commits.find((commit) => commit.sha === selectedSha) : undefined
      const selectedNode = selectedSha && nodeBySha ? nodeBySha.get(selectedSha) : undefined
      const refresh = () => {
        setNotice(null)
        setNonce((value) => value + 1)
      }
      const loadMore = () => setLimit((value) => Math.min(500, value + 100))
      useAutoRefresh(refresh)

      const sessionRef = React.useRef(sessionId)
      React.useEffect(() => {
        if (sessionRef.current === sessionId) return
        sessionRef.current = sessionId
        if (!viewStore) setFallbackFilter(null)
        setLimit(80)
        setSearch('')
        setSelectedSha(null)
        setNotice(null)
      }, [sessionId, viewStore])

      React.useEffect(() => {
        if (!repo || !Array.isArray(repo.commits) || repo.commits.length === 0) {
          setSelectedSha(null)
          return
        }
        const preferred =
          selectionSnapshot && selectionSnapshot.sessionId === sessionId ? selectionSnapshot.sha : null
        setSelectedSha((previous) => {
          if (preferred && repo.commits.some((commit) => commit.sha === preferred)) return preferred
          return repo.commits.some((commit) => commit.sha === previous) ? previous : repo.commits[0].sha
        })
      }, [repo, selectionSnapshot, sessionId])

      React.useEffect(() => {
        if (!searching) return
        const matches = commits.filter((commit) => commitMatches(commit, search))
        if (matches.length === 0) {
          if (selectedSha !== null) setSelectedSha(null)
          return
        }
        if (!matches.some((commit) => commit.sha === selectedSha)) setSelectedSha(matches[0].sha)
      }, [searching, search, commits, selectedSha])

      const selectCommit = (sha) => {
        setSelectedSha(sha)
        if (selection && typeof selection.select === 'function') selection.select(sessionId, sha)
      }

      React.useEffect(() => {
        if (!state.error) return
        const code = state.error.code
        if ((code === 'git/unknown-ref' || code === 'request/bad-ref') && filter !== null) {
          setNotice(t('scope.missing'))
          setFilter(null)
        }
      }, [state.error, filter])

      const branchLabel = repo ? (repo.detached ? t('meta.detached') : repo.branch || t('meta.detached')) : t('panel.label')

      let main
      if (!sessionId) {
        main = h(Notice, { title: t('page.empty') })
      } else if (loading && !repo) {
        main = h(Skeleton)
      } else if (state.status === 'error') {
        main = h(
          'div',
          { className: 'gr-error', role: 'alert' },
          h('div', { className: 'gr-error-code' }, state.error.code),
          h('div', { className: 'gr-error-text' }, errorText(t, state.error)),
          h('button', { type: 'button', className: 'gr-text-button', onClick: refresh }, t('action.retry')),
        )
      } else if (repo) {
        const shownCommit = detailCommit || selectedCommit
        const operation =
          selectedNode && selectedNode.merge
            ? selectedNode.mergeTarget && selectedNode.mergeSource
              ? `${t('graph.merge')}: ${selectedNode.mergeTarget} ← ${selectedNode.mergeSource}`
              : `${t('graph.merge')} (${selectedNode ? (shownCommit ? (shownCommit.parents || []).length : 0) : 0})`
            : selectedNode && selectedNode.fork
              ? t('graph.fork')
              : ''
        const parents = shownCommit && Array.isArray(shownCommit.parents) ? shownCommit.parents : []
        const refs = shownCommit && Array.isArray(shownCommit.refs) ? shownCommit.refs : []
        const files = detail && Array.isArray(detail.files) ? detail.files : []
        const additions = files.reduce((sum, file) => sum + file.additions, 0)
        const deletions = files.reduce((sum, file) => sum + file.deletions, 0)
        const workspace = byId[sessionId] && byId[sessionId].cwd ? byId[sessionId].cwd : repo.root
        const authorName = detailCommit && detailCommit.author ? detailCommit.author.name : shownCommit ? shownCommit.author : ''
        const authorEmail = detailCommit && detailCommit.author ? detailCommit.author.email : shownCommit ? shownCommit.email : ''
        const authorDate = detailCommit && detailCommit.author ? detailCommit.author.date : shownCommit ? shownCommit.date : ''

        main = [
          notice !== null ? h('div', { className: 'gr-inline-notice', key: 'notice' }, notice) : null,
          h(
            'div',
            { className: 'gr-section-head', key: 'heading' },
            h('span', null, searching ? t('search.label') : t('page.title')),
            h(
              'span',
              { className: 'gr-count' },
              searching ? `${visibleCommits.length}/${commits.length}` : String(commits.length),
            ),
          ),
          searching ? h('div', { className: 'gr-search-note', key: 'search-note' }, t('search.loadingWindow')) : null,
          searching ? null : h(GraphLegend, { key: 'legend', legend: graph ? graph.legend : [], t }),
          visibleCommits.length === 0
            ? h(Notice, {
                key: 'empty',
                title: searching
                  ? t('search.empty')
                  : repo.unborn
                    ? t('state.unborn')
                    : filterEmpty
                      ? t('filter.empty')
                      : t('scope.emptyAll'),
                hint: repo.unborn && !searching ? t('state.unbornHint') : undefined,
              })
            : h(
                'div',
                {
                  key: 'graph',
                  className: `gr-graph-wrap${searching ? ' is-plain' : ''}`,
                  style: graph ? { '--gr-graph-width': `${graph.width + 10}px` } : undefined,
                },
                graph ? h(GraphSvg, { graph }) : null,
                h(
                  'ol',
                  { className: 'gr-commits' },
                  visibleCommits.map((commit) => {
                    const node = nodeBySha ? nodeBySha.get(commit.sha) : undefined
                    return h(CommitRow, {
                      key: commit.sha,
                      commit,
                      t,
                      node,
                      selected: commit.sha === selectedSha,
                      rowColor: node ? laneStroke(node.color) : undefined,
                      onSelect: selectCommit,
                    })
                  }),
                ),
              ),
          !searching && commits.length >= limit && limit < 500
            ? h('button', { type: 'button', className: 'gr-text-button gr-load-more', onClick: loadMore }, t('action.loadMore'))
            : null,
        ]

        return h(
          'div',
          { className: 'gr-page' },
          h('style', { 'data-plugin': ID }, CSS),
          h(
            'header',
            { className: 'gr-page-head' },
            h(
              'div',
              { className: 'gr-page-brand' },
              h('span', { className: 'gr-page-logo' }, h(RailGlyph, { size: 18 })),
              h(
                'div',
                { className: 'gr-page-titles' },
                h('span', { className: 'gr-page-name' }, repo.name || t('panel.label')),
                h('span', { className: 'gr-page-path', title: repo.root }, repo.root),
              ),
            ),
            h(
              'div',
              { className: 'gr-page-tools' },
              h(SearchBox, { t, value: search, onChange: setSearch }),
              h(
                'span',
                { className: 'gr-branch-chip', title: repo.upstream || '' },
                h('span', { className: 'gr-chip-dot', 'aria-hidden': true }),
                branchLabel,
              ),
              repo.changes > 0
                ? h('span', { className: 'gr-badge is-warn' }, `${repo.changes} ${t('meta.changes')}`)
                : null,
              h(BranchMultiMenu, {
                t,
                label: t('filter.local'),
                branches: repo.branches && Array.isArray(repo.branches.locals) ? repo.branches.locals : [],
                selected: selectedLocals,
                remote: false,
                onChange: (next) => setGroup(false, next),
              }),
              h(BranchMultiMenu, {
                t,
                label: t('filter.remote'),
                branches: repo.branches && Array.isArray(repo.branches.remotes) ? repo.branches.remotes : [],
                selected: selectedRemotes,
                remote: true,
                onChange: (next) => setGroup(true, next),
              }),
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
          ),
          h(
            'div',
            { className: 'gr-page-body' },
            h('main', { className: 'gr-page-main' }, main),
            h(
              'aside',
              { className: 'gr-page-detail' },
              h('div', { className: 'gr-detail-head' }, t('page.detail')),
              shownCommit
                ? [
                    h('h2', { className: 'gr-detail-subject', key: 'subject' }, shownCommit.subject || t('commit.noSubject')),
                    operation ? h('div', { className: 'gr-detail-op', key: 'op' }, operation) : null,
                    h(
                      'dl',
                      { className: 'gr-detail-grid', key: 'meta' },
                      h('dt', { className: 'gr-detail-label' }, t('page.sha')),
                      h('dd', { className: 'gr-detail-value' }, h('code', null, shownCommit.sha)),
                      h('dt', { className: 'gr-detail-label' }, t('page.author')),
                      h('dd', { className: 'gr-detail-value' }, `${authorName}${authorEmail ? ` <${authorEmail}>` : ''}`),
                      h('dt', { className: 'gr-detail-label' }, t('page.date')),
                      h('dd', { className: 'gr-detail-value' }, formatFullDate(authorDate)),
                      h('dt', { className: 'gr-detail-label' }, t('page.parents')),
                      h(
                        'dd',
                        { className: 'gr-detail-value' },
                        parents.length > 0
                          ? parents.map((parent) =>
                              h('code', { key: parent, title: parent, style: { marginRight: '6px' } }, parent.slice(0, 7)),
                            )
                          : '—',
                      ),
                      h('dt', { className: 'gr-detail-label' }, t('page.refs')),
                      h(
                        'dd',
                        { className: 'gr-detail-value' },
                        refs.length > 0
                          ? h(
                              'span',
                              { className: 'gr-detail-refs' },
                              refs.map((ref) =>
                                h(
                                  'span',
                                  { key: ref, className: `gr-ref${ref.startsWith('tag:') ? ' is-tag' : ''}`, title: ref },
                                  prettyRef(ref),
                                ),
                              ),
                            )
                          : '—',
                      ),
                    ),
                    detailCommit && detailCommit.body
                      ? h(
                          'div',
                          { className: 'gr-detail-section', key: 'message' },
                          h('div', { className: 'gr-detail-section-head' }, t('page.message')),
                          h('pre', { className: 'gr-detail-body' }, detailCommit.body.replace(/\s+$/, '')),
                          detailCommit.bodyTruncated
                            ? h('div', { className: 'gr-detail-note' }, t('page.bodyTruncated'))
                            : null,
                        )
                      : null,
                    files.length > 0
                      ? h(
                          'div',
                          { className: 'gr-detail-section', key: 'files' },
                          h(
                            'div',
                            { className: 'gr-detail-section-head' },
                            h('span', null, t('page.files')),
                            h('span', { className: 'gr-detail-file-total' }, `${files.length} · +${additions} −${deletions}`),
                          ),
                          h(
                            'div',
                            { className: 'gr-file-list' },
                            files.map((file) =>
                              h(FileRow, {
                                key: `${file.oldPath || ''}:${file.path}`,
                                file,
                                t,
                                onOpen:
                                  openFile && typeof openFile === 'function'
                                    ? () =>
                                        openFile(
                                          fileAddressFor(
                                            sessionId,
                                            workspace,
                                            repo.root,
                                            file.path,
                                          ),
                                        )
                                    : undefined,
                              }),
                            ),
                          ),
                          detail.filesTruncated
                            ? h('div', { className: 'gr-detail-note' }, t('page.filesTruncated'))
                            : null,
                        )
                      : null,
                    detailState.status === 'loading'
                      ? h('div', { className: 'gr-muted', key: 'loading' }, t('page.loadingDetail'))
                      : null,
                    detailState.error
                      ? h(
                          'div',
                          { className: 'gr-error-text', key: 'detail-error' },
                          errorText(t, detailState.error),
                        )
                      : null,
                    detail
                      ? h(DiffView, {
                          key: 'diff',
                          patch: detail.patch,
                          truncated: detail.patchTruncated,
                          unavailable: detail.patchUnavailable,
                          t,
                        })
                      : null,
                  ]
                : h('div', { className: 'gr-detail-empty' }, t('page.selectCommit')),
            ),
          ),
        )
      }

      return h(
        'div',
        { className: 'gr-page' },
        h('style', { 'data-plugin': ID }, CSS),
        h(
          'header',
          { className: 'gr-page-head' },
          h(
            'div',
            { className: 'gr-page-brand' },
            h('span', { className: 'gr-page-logo' }, h(RailGlyph, { size: 18 })),
            h(
              'div',
              { className: 'gr-page-titles' },
              h('span', { className: 'gr-page-name' }, t('panel.label')),
              h('span', { className: 'gr-page-path' }, t('guide.description')),
            ),
          ),
          h(
            'div',
            { className: 'gr-page-tools' },
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
        ),
        h(
          'div',
          { className: 'gr-page-body' },
          h('main', { className: 'gr-page-main' }, main),
          h(
            'aside',
            { className: 'gr-page-detail' },
            h('div', { className: 'gr-detail-head' }, t('page.detail')),
            h('div', { className: 'gr-detail-empty' }, t('page.selectCommit')),
          ),
        ),
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
  --gr-lane-1: #3b82f6;
  --gr-lane-2: #2ea043;
  --gr-lane-3: #a371f7;
  --gr-lane-4: #c69026;
  --gr-lane-5: #db61a2;
  --gr-lane-6: #2aa7b8;
  --gr-lane-7: #d4712b;
  --gr-lane-8: #cf5b5b;
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
.gr-search {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
  margin: 2px 0 6px;
  padding: 2px 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
}
.gr-search:focus-within {
  border-color: var(--dsw-alias-brand-primary);
}
.gr-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 10px;
  line-height: 18px;
  outline: none;
}
.gr-search input::placeholder {
  color: var(--dsw-alias-label-secondary);
}
.gr-search-clear {
  appearance: none;
  flex: none;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
}
.gr-search-note {
  margin: 0 0 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
}
.gr-load-more {
  margin-top: 10px;
  width: 100%;
  text-align: center;
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
.gr-scope-wrap + .gr-scope-wrap .gr-scope-menu {
  left: auto;
  right: 0;
}
.gr-scope-search {
  width: 100%;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 1;
  margin-bottom: 4px;
  padding: 4px 6px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 5px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 10px;
  outline: none;
}
.gr-scope-search:focus {
  border-color: var(--dsw-alias-brand-primary);
}
.gr-scope-empty {
  padding: 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--dsw-alias-label-secondary);
  box-sizing: border-box;
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
.gr-legend {
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
}
.gr-legend > summary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  list-style: none;
}
.gr-legend > summary .gr-count {
  margin-left: auto;
}
.gr-legend > summary::before {
  content: "›";
  font-size: 12px;
  line-height: 1;
  color: var(--dsw-alias-label-secondary);
  transition: transform 0.15s ease;
}
.gr-legend[open] > summary::before {
  transform: rotate(90deg);
}
.gr-legend > summary::-webkit-details-marker {
  display: none;
}
.gr-legend[open] > summary {
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.gr-legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 7px 8px;
}
.gr-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.gr-commits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.gr-graph-wrap {
  position: relative;
  min-width: 0;
}
.gr-graph {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  overflow: visible;
}
.gr-commit {
  display: block;
  height: 64px;
  box-sizing: border-box;
  padding: 6px 0 6px var(--gr-graph-width, 24px);
  content-visibility: auto;
  contain-intrinsic-size: 64px;
}
.gr-graph-wrap.is-plain .gr-commit {
  padding-left: 0;
}
.gr-commit-body {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
}
.gr-subject-line {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}
.gr-subject-line .gr-subject {
  flex: 1;
  min-width: 0;
}
.gr-tip {
  flex: none;
  max-width: 9em;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 9px;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-subject {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  max-height: 2.7em;
  overflow-wrap: anywhere;
}
.gr-meta {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  font-size: 10px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.gr-author {
  max-width: 10em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-refs {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
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
.gr-op {
  flex: none;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
  font-size: 9px;
  line-height: 15px;
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
.gr-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding-top: var(--dsh-frame-top-clearance, 48px);
  color: var(--dsw-alias-label-primary);
  background: transparent;
  --gr-lane-1: #3b82f6;
  --gr-lane-2: #2ea043;
  --gr-lane-3: #a371f7;
  --gr-lane-4: #c69026;
  --gr-lane-5: #db61a2;
  --gr-lane-6: #2aa7b8;
  --gr-lane-7: #d4712b;
  --gr-lane-8: #cf5b5b;
}
.gr-page-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: none;
}
.gr-page-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.gr-page-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1);
  flex: none;
}
.gr-page-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}
.gr-page-name {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-page-path {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gr-page-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.gr-page-tools .gr-search {
  flex: none;
  width: 190px;
  margin: 0;
}
.gr-page-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.gr-page-main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 14px 24px 24px;
}
.gr-page .gr-section-head {
  margin-bottom: 6px;
}
.gr-page .gr-commits {
  gap: 2px;
}
.gr-page .gr-commit {
  padding-right: 12px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--gr-row-color, transparent) 8%, transparent);
}
.gr-page .gr-commit.is-selectable {
  cursor: pointer;
}
.gr-page .gr-commit.is-selectable:hover {
  background: color-mix(in srgb, var(--gr-row-color, transparent) 13%, transparent);
}
.gr-page .gr-commit.is-selected {
  background: color-mix(in srgb, var(--gr-row-color, transparent) 17%, transparent);
  box-shadow: inset 3px 0 0 var(--gr-row-color, var(--dsw-alias-brand-primary));
}
.gr-page .gr-commit:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.gr-page .gr-graph-wrap {
  padding-top: 4px;
}
.gr-page-detail {
  width: 380px;
  flex: none;
  overflow: auto;
  padding: 16px 18px;
  border-left: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.gr-detail-head {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--dsw-alias-label-secondary);
  margin-bottom: 12px;
}
.gr-detail-subject {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.gr-detail-op {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  font-size: 10px;
}
.gr-detail-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 12px;
  margin: 0;
  font-size: 11px;
}
.gr-detail-label {
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.gr-detail-value {
  min-width: 0;
  overflow-wrap: anywhere;
}
.gr-detail-value code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}
.gr-detail-refs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.gr-detail-note {
  margin-top: 16px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
}
.gr-detail-empty {
  margin-top: 24px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
}
.gr-detail-section {
  margin-top: 16px;
}
.gr-detail-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
  letter-spacing: 0.02em;
}
.gr-detail-file-total {
  font-weight: 400;
  font-size: 10px;
}
.gr-detail-body {
  margin: 0;
  padding: 8px 10px;
  max-height: 200px;
  overflow: auto;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.gr-file-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  overflow: hidden;
}
.gr-file-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 5px 8px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
button.gr-file-row {
  cursor: pointer;
}
button.gr-file-row:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.gr-file-row + .gr-file-row {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.gr-file-path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
}
.gr-file-stat {
  flex: none;
  color: var(--dsw-alias-label-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  white-space: nowrap;
}
.gr-diff-wrap {
  margin-top: 16px;
}
.gr-diff {
  margin: 0;
  max-height: 360px;
  overflow: auto;
  padding: 8px 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  line-height: 1.45;
}
.gr-diff-line {
  display: block;
  padding: 0 8px;
  white-space: pre;
  color: var(--dsw-alias-label-secondary);
}
.gr-diff-line.is-add {
  color: var(--dsw-alias-state-success-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);
}
.gr-diff-line.is-del {
  color: var(--dsw-alias-state-error-primary);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);
}
.gr-diff-line.is-hunk {
  color: var(--dsw-alias-brand-primary);
  opacity: 0.9;
}
.gr-diff-line.is-file,
.gr-diff-line.is-meta {
  color: var(--dsw-alias-label-secondary);
  opacity: 0.75;
}
@media (max-width: 900px) {
  .gr-page-body {
    flex-direction: column;
  }
  .gr-page-detail {
    width: auto;
    max-height: 42%;
    border-left: 0;
    border-top: 1px solid var(--dsw-alias-border-l1);
  }
}
`

    /* ================= plugin ================= */

    const inject = ['slots', 'locale', 'sidebarRightTabs']

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      const sessions = ctx.get('sessions')
      const layout = ctx.get('layout')
      const selection = createSelectionStore()
      const viewStore = createViewStore()
      const sidebarRight = ctx.get('sidebarRight')
      const openFile =
        sidebarRight && typeof sidebarRight.openResource === 'function'
          ? (address) => sidebarRight.openResource(address)
          : undefined

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
                inject: () => ({
                  openPanel: typeof layout?.selectPanel === 'function' ? () => layout.selectPanel(PANEL_ID) : undefined,
                  selection,
                  viewStore,
                }),
              },
              GitrailBody,
            ),
          ),
        'gitrail: tab body',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('main', () =>
            ctx.slots.register(
              {
                name: 'main',
                key: PANEL_ID,
                locale: NS,
                inject: () => ({ sessions, selection, openFile, viewStore }),
              },
              GitrailPage,
            ),
          ),
        'gitrail: main panel',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: PANEL_ID,
                order: 20,
                label: () => t('panel.label'),
                locale: NS,
              },
              RailGlyph,
            ),
          ),
        'gitrail: panel entry',
      )
    }

    const plugin = { inject, apply }
    if (globalThis.__GITRAIL_TEST__) {
      plugin.__layoutGraph = layoutGraph
      plugin.__createSelectionStore = createSelectionStore
      plugin.__createViewStore = createViewStore
      plugin.__branchColorIndex = branchColorIndex
      plugin.__commitMatches = commitMatches
      plugin.__fileAddressFor = fileAddressFor
    }
    return plugin
  },
})
