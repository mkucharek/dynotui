---
id: task-55
title: Publish to npm registry
status: Done
assignee: []
created_date: '2026-01-09 16:50'
updated_date: '2026-01-09 20:18'
labels:
  - distribution
  - npm
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make DynoTUI installable via `npm install -g dynotui`. Includes package.json setup, build configuration, and npm publish workflow.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 package.json has name, repository, author, engines, publishConfig fields
- [x] #2 LICENSE file exists with MIT text
- [x] #3 CHANGELOG.md exists with initial version
- [x] #4 README has npm install command and publishing instructions
- [x] #5 `pnpm verify` passes
- [x] #6 `npm pack` creates valid tarball
- [x] #7 Package installs and runs correctly from tarball
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update package.json with npm publishing fields\n2. Create LICENSE file (MIT)\n3. Create CHANGELOG.md\n4. Update README with install/publish instructions\n5. Run `pnpm verify` to ensure tests pass\n6. Test with `npm pack` and local install\n7. Publish with `npm publish`
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Package name: @mkucharek/dynotui\nVersion: 0.1.0\nNode requirement: >=20\nPublishing: Manual only (npm publish)

PR: https://github.com/mkucharek/dynotui/pull/6

Published v0.1.0 to npm registry on 2026-01-09
<!-- SECTION:NOTES:END -->
