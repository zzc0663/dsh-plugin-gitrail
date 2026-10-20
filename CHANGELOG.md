# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
semantic versioning.

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
