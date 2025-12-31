# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DynoTUI is a terminal user interface (TUI) client for AWS DynamoDB built with React and Ink. It provides keyboard-driven navigation for browsing tables, scanning/querying data, and viewing items.

## Workflow

1. Do not work on the `master` branch directly. Create a new feature branch from `master` for each task/feature/bugfix.
2. When planning work, make sure to create backlog tasks for each step and store the plan in backlog docs. Check existing issues and backlog to avoid duplicates.
3. Write code with clear, concise commits. Each commit should represent a single logical change.
4. Write tests for new features and bug fixes. Ensure existing tests pass before submitting a PR.
5. Before creating a PR, run `pnpm check` to lint and format code. Ensure code coverage thresholds are met. Make sure to update docs / tasks with any relevant information.
6. Create a PR against `master` with a clear description of changes.

## Commands

```bash
pnpm dev          # Run in dev mode (tsx)
pnpm dev:local    # Run against local DynamoDB
pnpm build        # Build with tsup
pnpm test         # Run unit tests
pnpm test:watch   # Run tests in watch mode
pnpm test:e2e:local # Run e2e tests (local DB)
pnpm lint         # Check with Biome
pnpm check        # Lint + format with Biome (auto-fix)
pnpm verify       # check + build + test
```

Run single test file: `pnpm test src/path/to/file.test.ts`

### Local DynamoDB

```bash
pnpm db:start     # Start DynamoDB Local container
pnpm db:seed      # Create tables and seed data
pnpm db:stop      # Stop container
```

## Architecture

### Tech Stack

- **UI**: React 19 + Ink 6 (React renderer for CLI)
- **State**: Zustand stores
- **AWS**: @aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb
- **Schema validation**: Zod 4
- **Testing**: Vitest + ink-testing-library

### Directory Structure

```
src/
├── index.tsx          # Entry: CLI args (meow), app shell, view router
├── views/             # Full-screen views (HomeView, TableView, ItemView, SettingsView)
├── components/        # Reusable UI: layout/, table/, forms/
├── store/             # Zustand: app-store (global), use-*.ts (feature hooks)
├── services/          # AWS: dynamodb/ (client, scan, query, tables), aws-config
├── schemas/           # Zod schemas (config, query-params)
└── types/             # TypeScript types (navigation)
```

### Key Patterns

**Navigation**: View-based routing via `useAppStore().navigate()`. ViewState discriminated union in `types/navigation.ts`. History stack for back navigation.

**Data hooks**: Custom hooks (`useTables`, `useScan`, `useQuery`) encapsulate DynamoDB operations with loading/error/pagination state. Located in `store/`.

**DynamoDB client**: Singleton with caching in `services/dynamodb/client.ts`. Uses profile-based credentials via `fromIni`.

**Config persistence**: User config saved to `~/.config/dynotui/config.json` via `services/user-config.ts`.

### Testing

- Store tests run in jsdom environment (configured in vitest.config.ts)
- Component tests use ink-testing-library
- Coverage thresholds: 60% lines/functions/statements, 55% branches

## Verifying Changes with tmux

Use tmux to run and interact with dynotui to verify your changes work correctly. This is especially useful for UI changes.

### Quick verification

```bash
# Start app in tmux session
tmux new-session -d -s dyno -x 120 -y 35 'pnpm dev:local'

# Capture current screen
tmux capture-pane -t dyno -p

# Send keystrokes (e.g., navigate down, press enter)
tmux send-keys -t dyno j
tmux send-keys -t dyno Enter

# Send special keys
tmux send-keys -t dyno Escape
tmux send-keys -t dyno Tab

# Kill session when done
tmux kill-session -t dyno
```

### Using the TmuxDriver (for scripted verification)

The e2e test helper `src/tests/e2e/helpers/tmux-driver.ts` provides a reusable driver:

```typescript
import { createDriver } from './src/tests/e2e/helpers/tmux-driver.js'

const driver = createDriver({ sessionName: 'verify' })
await driver.start('pnpm dev:local')
await driver.waitFor('Tables')
driver.sendKeys('2')           // Focus tables panel
driver.sendSpecialKey('Enter') // Select table
await driver.waitFor('scan')
console.log(driver.capture())  // Print screen
driver.cleanup()
```

### When to verify with tmux

- After UI component changes
- After navigation logic changes
- After keybinding changes
- Before committing significant UI work

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_workflow_overview()` tool to load the tool-oriented overview (it lists the matching guide tools).

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:

- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and completion
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
