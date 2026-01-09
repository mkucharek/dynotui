# DynoTUI User Guide

A keyboard-driven terminal interface for AWS DynamoDB.

## Quick Start

### Installation

```bash
# npm
npm install -g dynotui

# or Homebrew (macOS)
brew install dynotui
```

### First Run

```bash
# Use default AWS profile
dynotui

# Specify profile and/or region
dynotui --profile production --region us-east-1
```

DynoTUI uses your existing AWS credentials from `~/.aws/credentials`. Make sure you have valid credentials configured.

### 30-Second Tour

1. **Launch** - Run `dynotui` in your terminal
2. **Pick a table** - Use `j`/`k` to navigate, `Enter` to open
3. **Browse data** - Scroll through items, press `Enter` to view details
4. **Filter** - Press `f` to add filters, `q` to query by key
5. **Go back** - Press `Esc` to return to previous screen

---

## Navigation Basics

DynoTUI uses vim-style navigation throughout:

| Key | Action |
|-----|--------|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `Enter` | Select / Open |
| `Esc` | Go back |
| `q` | Quit (from home) |

### Panel Focus

The interface has multiple panels. Switch between them with:

| Key | Action |
|-----|--------|
| `1` | Focus sidebar (profiles) |
| `2` | Focus sidebar (tables) |
| `0` | Focus main content |
| `Tab` | Cycle panels |

---

## Browsing Tables

### Home Screen

When you launch DynoTUI, you see two sidebar tabs:

- **Profiles** (`1`) - Your AWS profiles from `~/.aws/credentials`
- **Tables** (`2`) - DynamoDB tables in current account/region

Press `Enter` on a table to open it.

| Key | Action |
|-----|--------|
| `n` | Load more tables |
| `r` | Refresh list |
| `s` | Open settings |
| `?` | Show current config |

### Switching Profiles/Regions

1. Press `1` to focus the Profiles tab
2. Navigate to a profile, press `Enter`
3. Choose how to handle the region:
   - Keep current region
   - Use profile's default region
   - Pick a specific region

---

## Viewing Table Data

### Scan Mode (Default)

When you open a table, DynoTUI performs a scan showing all items.

| Key | Action |
|-----|--------|
| `j`/`k` | Navigate rows |
| `Enter` | View item details |
| `n` | Load next page |
| `r` | Refresh |
| `f` | Add filters |
| `c` | Clear filters |
| `Esc` | Back to home |

### Query Mode

For large tables, querying by partition key is more efficient than scanning.

1. Press `q` to open query builder
2. Select index (optional - for GSI/LSI)
3. Enter partition key value (required)
4. Enter sort key value with operator (optional)
5. Press `Enter` to execute

**Sort Key Operators:**
- `=` equals
- `<` `>` `≤` `≥` comparisons
- `begins_with` string prefix
- `between` range

| Key | Action |
|-----|--------|
| `q` | Open query builder |
| `s` | Switch back to scan mode |
| `f` | Add post-query filters |

### Filtering

Press `f` to add filter conditions on any attribute.

**In the filter form:**
- `Tab` to move between fields
- Type attribute name, pick operator, enter value
- `Tab` again to add another filter
- `Enter` to apply
- `Esc` to cancel

**Filter Operators:**
| Operator | Shortcut | Description |
|----------|----------|-------------|
| `=` | `=` | Equals |
| `≠` | `!` | Not equals |
| `<` `>` `≤` `≥` | `<` `>` `[` `]` | Comparisons |
| `between` | `b` | Range (two values) |
| `begins_with` | `^` | String prefix |
| `contains` | `~` | Substring match |
| `exists` | `e` | Attribute exists |
| `not exists` | `x` | Attribute missing |

---

## Item Details

Press `Enter` on any row to view the full item as formatted JSON.

| Key | Action |
|-----|--------|
| `j`/`k` | Scroll |
| `g` | Jump to top |
| `G` | Jump to bottom |
| `Esc` | Back to table |

Values are color-coded:
- **Orange** - Keys
- **Green** - Strings
- **Gold** - Numbers
- **Blue** - Booleans
- **Gray** - Null

---

## Settings

Press `s` from home to configure defaults:

- **Default Profile** - AWS profile to use on startup
- **Default Region** - Region to use on startup
- **Page Size** - Items per page (25, 50, 100, 200)

Settings are saved to `~/.config/dynotui/config.json` and apply on next launch.

---

## Configuration Priority

DynoTUI resolves configuration in this order:

1. CLI flags (`--profile`, `--region`)
2. Environment variables (`AWS_PROFILE`, `AWS_REGION`)
3. Saved settings (`~/.config/dynotui/config.json`)
4. AWS SDK defaults

---

## Keyboard Reference

### Global
| Key | Action |
|-----|--------|
| `Ctrl+C` | Exit |
| `1`/`2`/`0` | Switch panel focus |
| `Tab` | Cycle panels |

### Home View
| Key | Action |
|-----|--------|
| `j`/`k` | Navigate |
| `Enter` | Select |
| `n` | Load more |
| `r` | Refresh |
| `s` | Settings |
| `?` | Show config |
| `q` | Quit |

### Table View
| Key | Action |
|-----|--------|
| `j`/`k` | Navigate rows |
| `Enter` | View item |
| `s` | Scan / Clear |
| `q` | Query builder |
| `f` | Filters |
| `n` | Next page |
| `r` | Refresh |
| `c` | Clear filters |
| `Esc` | Back |

### Item View
| Key | Action |
|-----|--------|
| `j`/`k` | Scroll |
| `g`/`G` | Top / Bottom |
| `Esc` | Back |

### Forms
| Key | Action |
|-----|--------|
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `↑`/`↓` | Cycle options |
| `Enter` | Submit |
| `Esc` | Cancel |

---

## DynamoDB Concepts

If you're new to DynamoDB, here's what you need to know:

### Keys
- **Partition Key** - Required. Determines which partition stores the item. Every item must have one.
- **Sort Key** - Optional. Combined with partition key, allows multiple items per partition.

### Indexes
- **GSI (Global Secondary Index)** - Query by different partition/sort keys. Like a separate table with its own keys.
- **LSI (Local Secondary Index)** - Same partition key, different sort key. Must be created with table.

### Scan vs Query
- **Scan** - Reads every item, then filters. Simple but expensive for large tables.
- **Query** - Uses partition key to find items directly. Fast and efficient.

**Rule of thumb:** Use Query when you know the partition key. Use Scan only for small tables or when you need everything.

### FilterExpression
Filters are applied *after* reading data. They reduce returned results but not consumed capacity. The `Scanned: X` count shows how many items were actually read.

---

## Troubleshooting

### "No tables found"
- Check your AWS credentials are valid
- Verify the region has DynamoDB tables
- Press `?` to see current profile/region

### "Access Denied"
- Your IAM user/role needs DynamoDB permissions
- Minimum required: `dynamodb:ListTables`, `dynamodb:DescribeTable`, `dynamodb:Scan`, `dynamodb:Query`

### Terminal too small
- DynoTUI requires minimum 80x16 terminal
- Resize your terminal window

### Wrong region
- Press `1` to focus profiles, select profile, choose region
- Or restart with `--region` flag

---

## Tips

1. **Use Query for large tables** - Scanning millions of items is slow and expensive
2. **Partition key first** - Always know your partition key when querying
3. **Check scanned count** - High scanned count with low results means inefficient filtering
4. **Use `begins_with`** - Great for hierarchical sort keys like `ORDER#2024#001`
5. **Press `?`** - Quick way to verify you're connected to the right account/region
