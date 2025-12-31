# DynoTUI

A terminal user interface (TUI) client for AWS DynamoDB built with React and Ink.

## Installation

```bash
pnpm install
```

## Usage

### With AWS credentials

```bash
pnpm dev
```

Uses your default AWS profile. Override with CLI args:
```bash
pnpm dev -- --profile my-profile --region eu-west-1
```

### With Local DynamoDB

Start DynamoDB Local container and seed test data:

```bash
pnpm db:start    # Start DynamoDB Local (podman)
pnpm db:seed     # Create tables and seed data
pnpm dev:local   # Run dynotui against local DB
```

Stop container when done:
```bash
pnpm db:stop
```

#### Seeded Tables

| Table | Items | Indexes |
|-------|-------|---------|
| `e2e-test-table` | 50 | - |
| `orders` | 80 | 1 GSI (customer-orders-index) |
| `products` | 75 | 1 GSI + 1 LSI |
| `application-logs` | 100 | 2 GSIs |

## Development

```bash
pnpm dev          # Run in dev mode
pnpm build        # Build with tsup
pnpm test         # Run unit tests
pnpm check        # Lint + format (Biome)
pnpm verify       # check + build + test
```

## E2E Tests

E2E tests use tmux to interact with the running TUI.

### Prerequisites

- tmux installed
- Podman (for DynamoDB Local)

### Running E2E Tests

```bash
# With local DynamoDB (recommended - deterministic)
pnpm db:start
pnpm db:seed
pnpm test:e2e:local

# With real AWS (requires valid credentials)
pnpm test:e2e
```

## License

MIT
