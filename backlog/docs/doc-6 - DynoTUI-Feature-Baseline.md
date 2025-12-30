---
id: doc-6
title: DynoTUI Feature Baseline
type: other
created_date: '2025-12-30 09:59'
updated_date: '2025-12-30 10:09'
---
# DynoTUI Feature Baseline

Comprehensive feature reference for building DynoTUI - a terminal UI DynamoDB client. Features sourced from existing clients: Dynobase, Dynomate, NoSQL Workbench, dynein, ddv, and ddbsh.

## Development Phases

- **Phase 1**: Read-only operations (browse, query, scan, view)
- **Phase 2**: Core data operations (create, update, delete items)
- **Phase 3**: Advanced features (import/export, PartiQL - prioritized)
- **Future**: Table management (create/delete/truncate tables)

---

## Client Overview

| Client | Type | Platform | License |
|--------|------|----------|---------|
| [Dynobase](https://dynobase.dev/) | GUI | Electron | Commercial |
| [Dynomate](https://dynomate.io/) | GUI | Electron | Commercial |
| [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.html) | GUI | Native | Free (AWS) |
| [dynein](https://github.com/awslabs/dynein) | CLI | Terminal | Apache 2.0 |
| [ddv](https://github.com/lusingander/ddv) | TUI | Terminal | MIT |
| [ddbsh](https://github.com/awslabs/dynamodb-shell) | Shell | Terminal | Apache 2.0 |

---

## Phase 1: Read-Only Operations

### 1.1 Connection & Authentication

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| AWS profile switching | All clients | Profile picker (Ctrl+p) |
| Region switching | All clients | Region selector per profile |
| MFA token input | Dynobase, Dynomate | Terminal prompt |
| SSO integration | Dynobase, Dynomate, dynein | Support `aws sso login` flow |
| aws-vault support | Dynobase, dynein | External credential provider |
| DynamoDB Local | All clients | Custom endpoint config |
| LocalStack | Dynobase, dynein, ddbsh | Endpoint override |
| IAM role assumption | ddbsh | Cross-account access |
| Credential caching | dynein | Faster reconnects |

### 1.2 Table Discovery

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| List tables | All clients | Vim-style list (j/k nav) |
| Search/filter tables | Dynobase, Dynomate, ddv | Fuzzy search input |
| Multi-region search | Dynobase | Parallel region scan |
| Table metadata view | All clients | Details panel (key schema, indexes, billing) |
| Schema caching | dynein | Cache for autocomplete, faster startup |
| Context persistence | dynein | Remember last table on restart |
| Favorite tables | Dynobase | Pin frequently used tables |

### 1.3 Query Operations

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Query (by partition key) | All clients | Form-based query builder |
| Scan (full table) | All clients | Scan with optional filters |
| GetItem (single item) | All clients | Direct pk/sk input |
| Index selection (GSI/LSI) | All clients | Index picker dropdown |
| Sort key conditions | All clients | Operators: =, <, >, <=, >=, between, begins_with |
| Consistent reads | ddbsh, dynein | Toggle option |
| Query optimization | Dynobase | Warn if Scan when Query possible |
| EXPLAIN mode | ddbsh | Preview API calls before execution |
| Rate limiting | ddbsh | Configurable RCU limit for scans |

### 1.4 Filtering & Search

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Comparison operators | All clients | =, !=, <, >, <=, >= |
| String operators | All clients | contains, begins_with, not_contains |
| Existence checks | All clients | attribute_exists, attribute_not_exists |
| Type checks | ddbsh | attribute_type() |
| Multiple filters (AND/OR) | Dynobase, ddbsh | Filter builder with logic |
| Client-side sorting | Dynobase, Dynomate | Sort by any column |
| Attribute search | ddv | Quick filter across all fields |
| Projection (select columns) | dynein, ddbsh | Choose attributes to return |

### 1.5 Result Display

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Table/grid view | Dynobase, Dynomate, ddv | Column-based with horizontal scroll |
| JSON view | All clients | Raw JSON output |
| Virtual scrolling | Dynobase | Seamless pagination |
| Nested object expansion | Dynobase, Dynomate | Tree view for maps/lists |
| Standard JSON output | dynein | Plain JSON (not DDB-typed format) |
| Item count display | All clients | Show total/loaded count |
| Consumed capacity | ddbsh | Show RCU used |

### 1.6 Navigation & UX

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Keyboard shortcuts | Dynobase, ddv | Vim-style bindings |
| Multi-tab interface | Dynobase, Dynomate | Independent tabs (gt/gT) |
| Tab isolation | Dynomate | Separate credentials per tab |
| Back navigation | Dynobase | History stack (Esc) |
| Bookmarks | Dynobase | Save named queries |
| Query history | Dynobase, ddbsh | Recent queries list |
| Git-synced queries | Dynomate | Queries as files in `.dynotui/` |

---

## Phase 2: Data Operations

### 2.1 Item Viewing & Editing

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Item detail view | All clients | Dedicated panel |
| Inline cell editing | Dynobase, Dynomate | Edit mode in table |
| JSON editor | All GUI clients | External $EDITOR or inline |
| Form-based editor | Dynobase | Attribute form |
| Type selector | Dynobase, Dynomate | S, N, B, BOOL, NULL, L, M, SS, NS, BS |
| Validation | Dynobase | Pre-submit checks |
| Diff view | ddbsh (return values) | Show before/after on save |

### 2.2 CRUD Operations

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Create item | All clients | Form or JSON input |
| Update item | All clients | PutItem or UpdateItem |
| Delete item | All clients | Confirm prompt |
| Duplicate item | Dynobase | Clone with new key |
| Atomic counters | dynein | Increment/decrement shortcut |
| Conditional writes | ddbsh, dynein | Condition expression support |

### 2.3 Batch Operations

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Multi-select items | Dynobase | Visual selection (v, V) |
| Batch delete | Dynobase, dynein | Delete selected items |
| Batch write | dynein | Up to 25 items |
| Transactions | Dynobase | Step-by-step builder |
| Dry run / preview | Dynobase | Test before execute |
| Request chains | Dynomate | Sequential ops (put→query→update) |

---

## Phase 3: Advanced Features

### 3.1 Import/Export (HIGH PRIORITY)

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| CSV export | Dynobase, dynein | Export to file path |
| JSON export | Dynobase, dynein | JSON array format |
| JSONL export | dynein | Line-delimited (streaming) |
| CSV import | Dynobase, dynein | Type inference |
| JSON import | Dynobase, dynein | Validate before import |
| Type conversion | All | Map CSV/JSON → DDB types |
| Progress indicator | Dynobase | Progress bar |
| S3 export | Dynobase | Future enhancement |

### 3.2 PartiQL / SQL (HIGH PRIORITY)

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| SELECT queries | Dynobase, ddbsh | SQL-like syntax |
| INSERT | ddbsh | SQL insert |
| UPDATE | ddbsh | SQL update with SET |
| DELETE | ddbsh | SQL delete with WHERE |
| EXPLAIN | ddbsh | Show API translation |
| Syntax highlighting | Dynobase | Terminal colors |
| Query history | ddbsh | Persist SQL queries |

### 3.3 Code Generation

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| JavaScript/TypeScript | Dynobase | SDK v3 code |
| Python (Boto3) | Dynobase | Copy to clipboard |
| Go | Dynobase | AWS SDK for Go |
| Rust | Dynobase | aws-sdk-rust |
| AWS CLI | Dynobase, dynein | CLI commands |
| AI generation | Dynobase | Future/optional |

### 3.4 Developer Tools

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| JS terminal/REPL | Dynobase | Aggregate, map, filter results |
| Result piping | - | Pipe to jq or scripts |
| Query templates | - | Reusable parameterized queries |
| Environment variables | Dynomate | Per-profile variables |
| Request logging | Dynomate | Debug API calls |

### 3.5 Data Modeling

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Schema visualization | NoSQL Workbench | Read-only schema view |
| Access pattern mapping | NoSQL Workbench | Document query patterns |
| Sample data generation | NoSQL Workbench | Seed data for testing |
| Cost estimation | NoSQL Workbench | Query cost display |

---

## Future: Table Management

| Feature | Sources | TUI Implementation |
|---------|---------|-------------------|
| Create table | Dynobase, ddbsh | Key schema, billing mode form |
| Delete table | Dynobase, ddbsh | Require confirmation |
| Truncate table | Dynobase | Batch delete all items |
| Modify billing | ddbsh | Switch provisioned/on-demand |
| Add/remove GSI | ddbsh | Index management |
| Table cloning | NoSQL Workbench | Copy across regions/accounts |
| Enable PITR | ddbsh | Point-in-time recovery |
| Backup/restore | dynein, ddbsh | On-demand backups |

---

## Keyboard Shortcuts

### Navigation
| Key | Action | Source Inspiration |
|-----|--------|-------------------|
| `j/k` | Move down/up | ddv, vim |
| `h/l` | Move left/right | vim |
| `gg/G` | Top/bottom | ddv, vim |
| `Ctrl+d/u` | Page down/up | vim |
| `/` | Search/filter | vim |
| `Enter` | Select/drill down | ddv |
| `Esc` | Back/cancel | Dynobase |
| `q` | Quit/close | ddv |

### Actions
| Key | Action | Phase |
|-----|--------|-------|
| `r` | Refresh | 1 |
| `y` | Yank/copy JSON | 1 |
| `e` | Edit item | 2 |
| `d` | Delete item | 2 |
| `n` | New item | 2 |
| `X` | EXPLAIN query | 1 |
| `:` | Command mode | 1 |
| `?` | Help | 1 |

### Views
| Key | Action |
|-----|--------|
| `1-9` | Switch to tab N |
| `gt/gT` | Next/prev tab |
| `Tab` | Switch panels |
| `Ctrl+p` | Profile switcher |
| `Ctrl+r` | Region switcher |

---

## Technical Architecture

### Stack
- **UI**: React 19 + Ink 6
- **State**: Zustand stores
- **AWS**: @aws-sdk/client-dynamodb + lib-dynamodb
- **Validation**: Zod

### Implementation Priorities
1. Enhanced query/scan with filters
2. Index support, result sorting
3. Import/Export (CSV, JSON, JSONL)
4. PartiQL input mode
5. Code generation, bookmarks

### Performance
- Virtual scrolling for large results
- Internal pagination, seamless UX
- Schema caching (dynein pattern)
- Rate limiting for scans (ddbsh pattern)
- Lazy table list loading

---

## Feature Matrix

| Feature | Dynobase | Dynomate | Workbench | dynein | ddv | ddbsh |
|---------|:--------:|:--------:|:---------:|:------:|:---:|:-----:|
| Query/Scan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Filtering | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Item CRUD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Batch ops | ✓ | - | - | ✓ | - | ✓ |
| Transactions | ✓ | - | - | - | - | - |
| CSV import/export | ✓ | - | - | ✓ | - | - |
| JSON import/export | ✓ | - | - | ✓ | - | - |
| PartiQL | ✓ | - | - | - | - | ✓ |
| Code generation | ✓ | - | ✓ | - | - | - |
| EXPLAIN | - | - | - | - | - | ✓ |
| Git sync | - | ✓ | - | - | - | - |
| Vim keys | - | - | - | - | ✓ | - |
| Schema cache | - | - | - | ✓ | - | - |
| Rate limiting | - | - | - | - | - | ✓ |
| Table mgmt | ✓ | - | ✓ | ✓ | - | ✓ |
| Data modeling | - | - | ✓ | - | - | - |

---

## Unique Selling Points for DynoTUI

Combining the best from each client:

1. **Vim-first navigation** (from ddv) - keyboard-driven workflow
2. **Standard JSON output** (from dynein) - readable, not DDB-typed
3. **Schema caching** (from dynein) - fast startup, autocomplete
4. **EXPLAIN mode** (from ddbsh) - understand query cost
5. **Rate limiting** (from ddbsh) - safe scans
6. **Git-synced queries** (from Dynomate) - team collaboration
7. **PartiQL support** (from Dynobase, ddbsh) - SQL familiarity
8. **Import/Export** (from Dynobase, dynein) - data portability
9. **Code generation** (from Dynobase) - developer productivity
10. **Terminal-native** - no Electron, fast, scriptable
