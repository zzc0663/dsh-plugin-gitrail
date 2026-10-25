# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
semantic versioning.

## [0.6.0] — 2026-10-25

### Added

- Remote branches are expanded by default in the sidebar branch list.
- Two independent multi-select filters above the commit list: **Local** and
  **Remote**. Selecting branches in either group combines their commits; both
  groups can be all/partial/none, and an empty pair shows the empty state.
- Host `scope=refs` accepts repeated `local=` / `remote=` refnames, validates
  each against its group, and runs one bounded `git log` over the union. The
  legacy `scope=all|branch` contract remains.
- Branch rows now toggle membership in their local/remote group, matching the
  two dropdowns; the two triggers show `n/total` or All.

### Fixed

- Menu keyboard scrolling no longer scrolls the whole page horizontally; long
  option lists scroll inside the menu.
- The right-hand menu is right-aligned so it stays inside the panel.

## [0.5.0] — 2026-10-25

### Added

- Branch-list color rings: every local/remote branch shows its lane color; the
  current branch is filled, other branches empty, remote branches dashed.
- Commit subjects and detail titles are semibold; metadata stays secondary.
- Shared commit selection: clicking a commit in the sidebar opens the full graph
  panel with that commit selected; page selection updates the same store.
- `GET /dsh-plugin-gitrail/commit?session=&sha=` with full message, author and
  committer, parents, refs, `--numstat` file stats (binary/rename) and a bounded
  unified diff; first-parent diff for merges.
- Detail panel shows the message body, file list with `+/-`, clickable files
  (when the sidebar resource opener is available), and a line-colored diff.
- Safety caps: 16 KiB message, 200 files, 512 KiB patch; `truncated` flags.
- Four new client tests (branch colors, selection store, file address) and
  commit-detail tests (normal/rename/binary/merge/invalid).

## [0.4.0] — 2026-10-25

### Added

- Full-width **Gitrail Graph** main panel: registered in `sidebar.panellist` and
  the root `main` keyed slot, with the current session's colored graph on the
  left and a commit-info panel on the right.
- Branch-tip handoff: when history reaches another branch's tip, the lane adopts
  that branch's color and label, so shared ancestry no longer paints one color
  (for example `develop` handing over to `main` at `main`'s tip).
- Row tinting by lane color, branch pills at tips, a selectable commit row, and
  an "open full graph" button in the sidebar tab.

### Fixed

- The graph page includes the shared stylesheet, lane color variables, and
  session discovery through the client `sessions` service.

## [0.3.0] — 2026-10-25

### Added

- Colored multi-lane commit graph rendered as an SVG overlay: stable per-branch
  colors, fork points, merge nodes, HEAD halo, remote lanes (dashed / lower
  opacity), dangling parents, and a collapsible branch-color legend.
- Merge direction from parent order: the first parent continues the target lane
  (solid), later parents leave it as dashed source edges; the tooltip names the
  source and target lanes when they can be inferred.
- Two-line commit subjects in fixed 64px rows so graph rows and SVG lanes stay
  aligned; the full text remains in the tooltip.
- Nine pure `layoutGraph` unit tests covering linear, fork, merge, octopus,
  remote, dangling, empty, color stability, and shared tips.

## [0.2.0] — 2026-10-25

### Added

- Commit range selector: **all branches** (the new default), the current
  branch, or one local / remote-tracking branch. Branch rows in the sidebar are
  clickable and the commits header shows the active range.
- Host `scope` / `ref` parameters with an allow-list built from
  `for-each-ref`; `selection` and branch `refname` fields in the response.
- `--topo-order` for multi-branch logs; detached HEAD and unborn repositories
  remain supported.

### Fixed

- Symbolic remote HEAD (`origin/HEAD`, whose short name is just `origin`) is no
  longer listed as a remote branch, and the `origin/HEAD` decoration no longer
  appears in commit refs.
- Commit ref chips stay inside the right sidebar; up to four refs render, the
  commit rail is easier to see, and the remote-branch row has a clear
  disclosure control.

## [0.1.0] — 2026-10-21

### Added

- Initial `dsh-plugin-gitrail` bundle: Host entry, Client entry, bundle patch,
  English and Chinese locale metadata, and the split-rail icon.
- Right-sidebar `gitrail` tab type with a guide entry, registered through
  `ctx.sidebarRightTabs` and mounted in `sidebar.right.pane.tab`.
- Read-only git adapter with bounded output and timeouts: current branch,
  detached/unborn states, working-tree change count, ahead/behind, local and
  remote branches, and the latest 80 commits with refs.
- Loopback-only HTTP endpoint `GET /dsh-plugin-gitrail/repo?session=<id>`;
  the Session's workspace directory is resolved on the Host.
- UI states for loading, empty/unborn repositories, and actionable errors
  (`session/not-found`, `session/no-cwd`, `git/not-a-repo`, `git/unavailable`,
  `git/timeout`).
- Manifest checks and 17 tests covering parsers, the loopback route, and real
  temporary repositories.

### Notes

- Visual verification in a running DSH GUI is still pending.
- The package stays `private: true` until the npm release checklist is done.
