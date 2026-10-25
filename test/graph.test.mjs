import assert from 'node:assert/strict'
import test from 'node:test'

const React = {
  createElement() {
    return null
  },
  useState(value) {
    return [value, () => {}]
  },
  useEffect() {},
  useRef(value) {
    return { current: value }
  },
  useMemo(factory) {
    return factory()
  },
}

let plugin = null
globalThis.__GITRAIL_TEST__ = true
globalThis.window = {
  __ModuleLoader__: {
    load(definition) {
      plugin = definition.factory((name) => {
        if (name === 'react') return React
        throw new Error(`unexpected client require: ${name}`)
      })
    },
  },
}
await import('../client.js')

const layoutGraph = plugin.__layoutGraph

function commit(sha, parents, extra = {}) {
  return {
    sha,
    short: sha.slice(0, 7),
    parents,
    refs: extra.refs || [],
    subject: extra.subject || sha,
    author: 'Ada',
    email: 'ada@example.invalid',
    date: '2026-10-20T12:00:00+08:00',
  }
}

function branches(locals = [], remotes = []) {
  return {
    locals: locals.map((branch) => ({
      refname: `refs/heads/${branch.name}`,
      name: branch.name,
      sha: branch.sha,
      current: Boolean(branch.current),
    })),
    remotes: remotes.map((branch) => ({
      refname: `refs/remotes/${branch.name}`,
      name: branch.name,
      sha: branch.sha,
      current: false,
    })),
  }
}

test('linear history stays on one lane', () => {
  const graph = layoutGraph(
    [commit('c3', ['c2']), commit('c2', ['c1']), commit('c1', [])],
    branches([{ name: 'main', sha: 'c3', current: true }]),
  )

  assert.deepEqual(
    graph.nodes.map((node) => node.lane),
    [0, 0, 0],
  )
  assert.equal(graph.laneCount, 1)
  assert.equal(graph.width, 20)
  assert.equal(graph.height, 3 * 64)
  assert.deepEqual(
    graph.nodes.map((node) => node.row),
    [0, 1, 2],
  )
})

test('a second branch gets its own lane and joins at the fork point', () => {
  const graph = layoutGraph(
    [commit('c3', ['c2']), commit('d2', ['c1']), commit('c2', ['c1']), commit('c1', [])],
    branches([
      { name: 'main', sha: 'c3', current: true },
      { name: 'feature', sha: 'd2' },
    ]),
  )

  assert.deepEqual(
    graph.nodes.map((node) => node.lane),
    [0, 1, 0, 0],
  )
  assert.equal(graph.nodes[3].fork, true)
  assert.ok(graph.edges.some((edge) => edge.kind === 'join'))
  assert.deepEqual(
    graph.legend.map((item) => item.label),
    ['main', 'feature'],
  )
})

test('a merge commit draws a solid target edge and a dashed source edge', () => {
  const graph = layoutGraph(
    [commit('m', ['a', 'b'], { refs: ['HEAD -> main'] }), commit('a', []), commit('b', [])],
    branches([
      { name: 'main', sha: 'm', current: true },
      { name: 'feature', sha: 'b' },
    ]),
  )

  const node = graph.nodes[0]
  assert.equal(node.merge, true)
  assert.equal(node.head, true)
  assert.equal(node.mergeTarget, 'main')
  assert.equal(node.mergeSource, 'feature')

  const first = graph.edges.find((edge) => edge.kind === 'first')
  const merge = graph.edges.find((edge) => edge.kind === 'merge')
  assert.ok(first)
  assert.ok(merge)
  assert.equal(first.dashed, false)
  assert.equal(merge.dashed, true)
  assert.deepEqual(
    graph.nodes.map((entry) => entry.lane),
    [0, 0, 1],
  )
})

test('octopus merge allocates one lane per parent', () => {
  const graph = layoutGraph(
    [commit('m', ['a', 'b', 'c']), commit('a', []), commit('b', []), commit('c', [])],
    branches([{ name: 'main', sha: 'm', current: true }]),
  )

  assert.equal(graph.nodes[0].merge, true)
  assert.equal(graph.edges.filter((edge) => edge.kind === 'merge').length, 2)
  assert.equal(graph.laneCount, 3)
})

test('remote-tracking branches enter the graph and stay dashed', () => {
  const graph = layoutGraph(
    [commit('c2', ['c1']), commit('c1', [])],
    branches([], [{ name: 'origin/main', sha: 'c2' }]),
  )

  assert.equal(graph.nodes[0].remote, true)
  assert.ok(graph.segments.some((segment) => segment.remote && segment.x1 === 10))
  assert.deepEqual(
    graph.legend.map((item) => item.label),
    ['origin/main'],
  )
})

test('a parent outside the loaded window is marked dangling', () => {
  const graph = layoutGraph([commit('c1', ['missing'])], branches([{ name: 'main', sha: 'c1' }]))

  assert.equal(graph.edges.length, 1)
  assert.equal(graph.edges[0].dangling, true)
  assert.equal(graph.laneCount, 1)
})

test('empty input returns an empty graph', () => {
  const graph = layoutGraph([], branches())
  assert.deepEqual(graph.nodes, [])
  assert.deepEqual(graph.edges, [])
  assert.equal(graph.height, 0)
  assert.equal(graph.width, 20)
})

test('branch colors are stable across layouts', () => {
  const input = [commit('c1', [])]
  const refs = branches([
    { name: 'main', sha: 'c1', current: true },
    { name: 'feature', sha: 'c1' },
  ])
  const first = layoutGraph(input, refs)
  const second = layoutGraph(input, refs)
  assert.equal(first.nodes[0].color, second.nodes[0].color)
})

test('one commit with several branch tips yields one node', () => {
  const graph = layoutGraph(
    [commit('c1', [])],
    branches([
      { name: 'main', sha: 'c1', current: true },
      { name: 'develop', sha: 'c1' },
    ]),
  )

  assert.equal(graph.nodes.length, 1)
  assert.equal(graph.nodes[0].lane, 0)
  assert.equal(graph.nodes[0].merge, false)
})

test('a branch tip hands the lane over to its own branch color', () => {
  const graph = layoutGraph(
    [commit('c3', ['c2']), commit('c2', ['c1']), commit('c1', [])],
    branches([
      { name: 'develop', sha: 'c3', current: true },
      { name: 'main', sha: 'c2' },
    ]),
  )

  assert.equal(graph.nodes[0].label, 'develop')
  assert.equal(graph.nodes[1].label, 'main')
  assert.equal(graph.nodes[1].tip.name, 'main')
  assert.notEqual(graph.nodes[0].color, graph.nodes[1].color)
})

test('local and remote branches share a branch color', () => {
  const branchColorIndex = plugin.__branchColorIndex
  assert.equal(branchColorIndex('develop', false), branchColorIndex('origin/develop', true))
  assert.notEqual(branchColorIndex('develop', false), branchColorIndex('main', false))
})

test('a newer branch gets its own rail when the older tip is an ancestor', () => {
  const graph = layoutGraph(
    [commit('c3', ['c2']), commit('c2', ['c1']), commit('c1', [])],
    branches([
      { name: 'develop', sha: 'c3', current: true },
      { name: 'main', sha: 'c1' },
    ]),
  )

  const develop = graph.nodes.find((node) => node.sha === 'c3')
  const middle = graph.nodes.find((node) => node.sha === 'c2')
  const main = graph.nodes.find((node) => node.sha === 'c1')

  assert.equal(graph.laneCount, 2)
  assert.equal(develop.lane, 1)
  assert.equal(middle.lane, 1)
  assert.equal(main.lane, 0)
  assert.ok(graph.edges.some((edge) => edge.x1 !== edge.x2))
})

test('the selection store emits only on real changes', () => {
  const store = plugin.__createSelectionStore()
  let changes = 0
  const off = store.subscribe(() => {
    changes += 1
  })

  store.select('s1', 'abc')
  assert.deepEqual(store.getSnapshot(), { sessionId: 's1', sha: 'abc' })
  store.select('s1', 'abc')
  assert.equal(changes, 1)
  store.clear()
  assert.equal(store.getSnapshot(), null)
  assert.equal(changes, 2)
  off()
  store.select('s2', 'def')
  assert.equal(changes, 2)
})

test('file addresses stay relative to the session workspace', () => {
  const address = plugin.__fileAddressFor('session-1', 'D:/work/demo', 'D:/work/demo', 'src/a b.ts')
  assert.equal(address, 'dsh-resource://file/session/session-1/src/a%20b.ts')

  const nested = plugin.__fileAddressFor('session-1', 'D:/work', 'D:/work/demo', 'src/a.ts')
  assert.equal(nested, 'dsh-resource://file/session/session-1/demo/src/a.ts')
})

test('commit search matches subject, author, SHA and refs', () => {
  const item = commit('abc1234', [], {
    subject: 'feat: add graph',
    refs: ['HEAD -> develop'],
    author: 'Ada',
    email: 'ada@example.invalid',
  })

  assert.equal(plugin.__commitMatches(item, 'graph'), true)
  assert.equal(plugin.__commitMatches(item, 'ADA'), true)
  assert.equal(plugin.__commitMatches(item, 'abc123'), true)
  assert.equal(plugin.__commitMatches(item, 'develop'), true)
  assert.equal(plugin.__commitMatches(item, 'nope'), false)
  assert.equal(plugin.__commitMatches(item, ''), true)
})

test('the view store shares and de-duplicates filters per session', () => {
  const store = plugin.__createViewStore()
  let changes = 0
  const off = store.subscribe(() => {
    changes += 1
  })

  store.set('s1', { locals: ['refs/heads/main'], remotes: [] })
  assert.deepEqual(store.getSnapshot('s1'), { locals: ['refs/heads/main'], remotes: [] })
  store.set('s1', { locals: ['refs/heads/main'], remotes: [] })
  assert.equal(changes, 1)
  store.set('s1', null)
  assert.equal(store.getSnapshot('s1'), null)
  assert.equal(changes, 2)
  off()
})
