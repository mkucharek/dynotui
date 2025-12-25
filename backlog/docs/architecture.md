# DynoTUI v0 Architecture

DynamoDB TUI client built with TypeScript + Ink.

## Tech Stack
- **TUI**: Ink (React CLI), @inkjs/ui, ink-table
- **AWS**: @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb
- **Validation**: Zod
- **CLI**: pastel (Ink's CLI framework)
- **State**: Zustand
- **Testing**: vitest, ink-testing-library (60% coverage)
- **Linting/Formatting**: Biome
- **Hooks**: lefthook
- **Bundling**: tsup
- **Binary**: pkg (for brew distribution)
- **Package Manager**: pnpm

## Project Structure
```
src/
├── index.tsx           # Entry + CLI args
├── app.tsx             # Root + router
├── components/
│   ├── layout/         # header, footer, panel
│   ├── table/          # data-table, pagination
│   ├── forms/          # query-form, filter-input
│   └── item-detail.tsx
├── views/
│   ├── home.tsx        # Table list
│   ├── table-view.tsx  # Scan/Query
│   └── item-view.tsx   # Item detail
├── services/dynamodb/
│   ├── client.ts       # Client factory
│   ├── tables.ts       # ListTables, DescribeTable
│   ├── scan.ts         # Scan + pagination
│   └── query.ts        # Query by PK/SK
├── store/
│   ├── app-store.ts      # Zustand store
│   ├── use-tables.ts
│   ├── use-scan.ts
│   └── use-query.ts
├── schemas/            # Zod schemas
└── utils/
```

## Core Features (v0)
- List/browse DynamoDB tables
- Scan with pagination
- Query by PK + optional SK
- Item detail view
- Multi-profile/region support

## Keybindings
| Key | Action |
|-----|--------|
| j/k, arrows | Navigate |
| Enter | Select |
| Esc | Back |
| q | Query mode |
| s | Scan mode |
| n/p | Next/Prev page |
| r | Region |
| P | Profile |

## Dependencies
**Runtime**: ink@5, @inkjs/ui@2, ink-table@3, react@18, @aws-sdk/*@3, zod@3, chalk@5, pastel@3, zustand@5

**Dev**: typescript@5, vitest@2, @biomejs/biome, lefthook, tsup@8, tsx@4, pkg@5
