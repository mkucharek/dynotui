---
title: "Phase 1: Project Setup"
status: Done
labels: [setup, infrastructure]
---

# Phase 1: Project Setup

Initialize project with TypeScript, tooling, and basic Ink scaffold.

## Tasks
- [x] `pnpm init` with package.json (type: module)
- [x] tsconfig.json: strict, ESM, JSX (react-jsx)
- [x] Install runtime deps: ink, @inkjs/ui, ink-table, react, @aws-sdk/*, zod, chalk, pastel, zustand
- [x] Install dev deps: typescript, vitest, @biomejs/biome, lefthook, tsup, tsx, pkg
- [x] biome.json config
- [x] lefthook.yml pre-commit hook
- [x] tsup.config.ts for bundling
- [x] vitest.config.ts with 60% coverage threshold
- [x] Basic src/index.tsx + src/app.tsx scaffold (pastel CLI)
- [x] pnpm scripts: dev, build, test, lint, format

## Acceptance
- `pnpm dev` launches basic Ink app
- `pnpm lint` passes
- `pnpm test` runs (even if no tests yet)
- `pnpm build` produces bundled output

## Refs
- docs: [[architecture]]
