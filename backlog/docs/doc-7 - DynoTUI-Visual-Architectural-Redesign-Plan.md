---
id: doc-7
title: DynoTUI Visual & Architectural Redesign Plan
type: other
created_date: '2025-12-30 10:53'
---
# DynoTUI Visual & Architectural Redesign Plan

Comprehensive plan to transform DynoTUI from functional-but-utilitarian to a polished, AWS-inspired terminal application with lazygit-quality aesthetics.

---

## Design Vision

### Aesthetic Direction
- **Primary Inspiration**: lazygit (clean panels, clear hierarchy, refined spacing)
- **Color Language**: AWS-inspired palette adapted for terminal readability
- **Typography**: Bold hierarchy, generous whitespace, consistent alignment
- **Interaction**: Vim-lite with always-visible hints, mode-based footer

### Core Principles
1. **Professional polish** - Every pixel intentional, no generic defaults
2. **AWS familiarity** - Colors and patterns echo AWS console
3. **Information density** - Dense but readable, smart defaults
4. **Discoverability** - Key hints always visible, no hidden modes

---

## Color System

### AWS-Inspired Palette (24-bit True Color)

```
┌─────────────────────────────────────────────────────────────┐
│  AWS Console Reference → Terminal Adaptation                │
├─────────────────────────────────────────────────────────────┤
│  #232F3E (Squid Ink)  →  Background context, headers        │
│  #FF9900 (Orange)     →  Primary accent, active states      │
│  #0073BB (Blue)       →  Links, focused elements            │
│  #1B8A51 (Green)      →  Success, active indicators         │
│  #D13212 (Red)        →  Errors, warnings                   │
│  #879596 (Gray)       →  Secondary text, borders            │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Color Mapping

| Element              | Current        | New (hex)                    |
|---------------------|----------------|------------------------------|
| Brand/Title         | cyan           | #FF9900 (AWS Orange)         |
| Focused border      | cyan           | #0073BB (AWS Blue)           |
| Active indicator    | green          | #1B8A51 (AWS Green)          |
| Selection bg        | cyan bg        | #0073BB bg + white fg        |
| Data values         | yellow         | #FFD966 (soft gold)          |
| Keys (PK/SK)        | yellow         | #FF9900 (orange, bold)       |
| Secondary text      | dimColor       | #879596 (AWS Gray)           |
| Errors              | red            | #D13212 (AWS Red)            |
| Headers             | cyan bold      | #FFFFFF bold                 |
| Separator lines     | gray           | #3D4F5F (muted blue-gray)    |

---

## Layout Architecture

### Current vs. New Layout

**Current (1-line header, 1-line footer):**
```
┌─────────────────────────────────────────────────────────────┐
│ DynoTUI │ Profile: default │ Region: us-east-1             │
├──────────────────┬──────────────────────────────────────────┤
│ [1] Profiles     │                                          │
│ [2] Regions      │   Main Content                           │
│ [3] Tables       │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ q Quit  Esc Back  ? Help                                   │
└─────────────────────────────────────────────────────────────┘
```

**New (2-line header, 2-line footer, tab sidebar):**
```
╭─────────────────────────────────────────────────────────────╮
│ ◆ DynoTUI                              ● default │ us-east-1│
│ ─ Connect › Browse › Saved                                  │
├──────────────────┬──────────────────────────────────────────┤
│ ▾ Connect        │                                          │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   Main Content                           │
│   Profiles       │                                          │
│   Regions        │                                          │
│                  │                                          │
├──────────────────┴──────────────────────────────────────────┤
│ default › us-east-1 › users › scan                         │
│ j/k Navigate  Enter Select  s Scan  q Query  ? Help        │
╰─────────────────────────────────────────────────────────────╯
```

### Header Design (2 lines)

**Line 1: Brand + Status**
```
│ ◆ DynoTUI                              ● default │ us-east-1│
  ↑ brand                                ↑ connection status
```
- `◆` brand mark (AWS Orange #FF9900)
- Connection indicator: `●` connected (green), `○` disconnected (red)
- Profile and region right-aligned

**Line 2: Breadcrumb Navigation**
```
│ ─ Connect › Browse › Saved          users › scan (3 filters)│
  ↑ tab indicator                     ↑ current context
```
- Underline shows active tab
- Right side shows current table/mode context
- Filters count when active

### Footer Design (2 lines)

**Line 1: Breadcrumb Path**
```
│ default › us-east-1 › users › scan                         │
```
- Full navigation path
- Colored segments: profile (orange), region (gray), table (white), mode (blue)

**Line 2: Mode-Based Key Hints**
```
│ j/k Navigate  Enter Select  s Scan  q Query  n Next  ? Help│
```
- Changes completely based on current mode
- Key in accent color, description in gray
- Maximum 6-7 bindings shown

### Sidebar Tabs

**Tab Structure:**
```
Connect (1)     Browse (2)      Saved (3)
───────────     ─────────       ────────
◉ Profiles      ◉ Tables        ◉ Queries
◉ Regions       ○ Indexes       ○ Bookmarks
                                ○ History
```

**Tab Switching:** `1`, `2`, `3` keys or `Tab` to cycle

**Visual Treatment:**
- Active tab: underlined, bold
- Inactive tabs: dim
- Tab content changes dynamically

---

## Component Redesign

### Panel Component

**Current:**
```tsx
<Box borderStyle="single" borderColor={focused ? 'cyan' : undefined}>
```

**New:**
```tsx
// Rounded corners for modern feel
borderStyle="round" // ╭─╮│╰╯
borderColor={focused ? '#0073BB' : '#3D4F5F'}

// Title treatment
<Text backgroundColor={focused ? '#0073BB' : '#232F3E'} color="white">
  {` ${title} `}
</Text>
```

**Visual:**
```
╭─ Results ─────────────────────────────╮  (focused: blue border)
│                                       │
│  Content here                         │
│                                       │
╰───────────────────────────────────────╯

┌─ Results ─────────────────────────────┐  (unfocused: muted border)
│                                       │
│  Content here                         │
│                                       │
└───────────────────────────────────────┘
```

### DataTable Component

**Current Issues:**
- Cyan background selection (harsh)
- No type formatting
- Basic separator line

**New Design:**
```
│ partition_id     │ sort_key  │ status    │ count │ metadata  │
│──────────────────│───────────│───────────│───────│───────────│
│ user_123         │ 2024-01   │ active    │    42 │ {2 keys}  │
│▸user_456         │ 2024-02   │ pending   │   128 │ {5 keys}  │  ← selected row
│ user_789         │ 2024-03   │ ∅         │     0 │ <binary>  │
│──────────────────│───────────│───────────│───────│───────────│
│                            ▼ 3/150 items                     │
```

**Features:**
- Selection: `▸` indicator + subtle background (#0073BB20)
- Numbers: right-aligned
- Null: `∅` symbol (dim)
- Binary: `<binary 256b>` format
- Sets: `{a, b, c}` format
- Nested objects: `{N keys}` summary
- Scroll indicator: `▲`/`▼` with position

### Sidebar Section

**Current:**
```
[1] Profiles (3)
──────────────────────────
> default
  prod            ◄
  staging
```

**New:**
```
▾ Profiles                               3 ▼
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  default                         ● active
▸ prod                                     
  staging                                  
                                         ▼
```

**Features:**
- `▾`/`▸` collapse indicator (future)
- Count right-aligned
- `●` active indicator (green)
- `▸` selection cursor
- `▼` scroll indicator when truncated
- Dotted separator for lighter feel

### Loading States

**Current:**
```
⠋ Loading...
```

**New:**
```
◐ Scanning table...           (rotating: ◐ ◓ ◑ ◒)
  Scanned: 150 items
```

Or for indeterminate:
```
● ○ ○ Connecting...           (pulsing dots)
```

### Error States

**Current:**
```
AccessDeniedException: User is not authorized
```

**New:**
```
╭─ Error ──────────────────────────────────────────────────────╮
│ ✖ Access Denied                                              │
│                                                              │
│   Your credentials don't have permission for this operation. │
│                                                              │
│   Try: aws sso login --profile prod                          │
│   Or:  Check IAM policy for dynamodb:Scan permission         │
│                                                              │
│                                        [r] Retry  [Esc] Back │
╰──────────────────────────────────────────────────────────────╯
```

---

## Metrics Display

**Current:**
```
Showing 1-10 of 50
```

**New:**
```
│ 10/50 scanned │ 2.5 RCU │ 1.2s │ ▸ Load more (n) │
```

Or in a more structured format:
```
╭─ Query Metrics ──────────────────────────────────────────────╮
│  Items: 10          Scanned: 50        Capacity: 2.5 RCU    │
│  Time:  1.2s        Filter:  80% hit   HasMore: ● yes       │
╰──────────────────────────────────────────────────────────────╯
```

---

## Mode-Based Footer Bindings

### Normal Mode (Table View)
```
│ j/k ↑↓ Navigate │ Enter View │ s Scan │ q Query │ f Filter │ n Next │ r Refresh │
```

### Query Form Mode
```
│ Tab Next field │ Enter Submit │ Esc Cancel │ f Add filter │
```

### Scan Filter Mode
```
│ Tab Next │ Enter Add │ d Delete filter │ Enter Submit all │ Esc Cancel │
```

### Item Detail Mode
```
│ j/k Scroll │ g Top │ G Bottom │ y Copy JSON │ e Edit │ Esc Back │
```

---

## Architecture Changes

### 1. Unified State Pattern

Move query hook to use app-store cache like scan:

```typescript
// app-store.ts additions
queryStateCache: Map<string, QueryState>
getQueryState: (tableName: string) => QueryState
setQueryState: (tableName: string, state: Partial<QueryState>) => void
```

This enables:
- Consistent state management
- No stale closure bugs
- State preservation on navigation
- Easier debugging

### 2. Tab-Based Sidebar

Replace `sidebarSection` with `sidebarTab`:

```typescript
type SidebarTab = 'connect' | 'browse' | 'saved'
type SidebarSection = 
  | { tab: 'connect', section: 'profiles' | 'regions' }
  | { tab: 'browse', section: 'tables' | 'indexes' }
  | { tab: 'saved', section: 'queries' | 'bookmarks' | 'history' }
```

### 3. Theme System

Create centralized theme config:

```typescript
// theme.ts
export const theme = {
  colors: {
    brand: '#FF9900',
    focus: '#0073BB',
    active: '#1B8A51',
    error: '#D13212',
    muted: '#879596',
    border: '#3D4F5F',
    surface: '#232F3E',
    text: '#FFFFFF',
    textSecondary: '#879596',
    dataValue: '#FFD966',
  },
  borders: {
    style: 'round', // or 'single', 'double', 'ascii'
    focused: '#0073BB',
    unfocused: '#3D4F5F',
  },
  spacing: {
    panelPadding: 1,
    sectionGap: 1,
  }
}
```

---

## Implementation Phases

### Phase 1: Architecture Refactor (Prerequisite)
1. Unify query/scan state in app-store
2. Create theme configuration system
3. Implement tab-based sidebar structure
4. Add mode state machine for footer bindings

### Phase 2: Core Visual Components
1. Header component (2-line, breadcrumb)
2. Footer component (2-line, mode-based)
3. Panel component (rounded, themed)
4. Sidebar tabs and sections

### Phase 3: Data Display
1. DataTable with type formatting
2. Smart column detection
3. Full row selection highlight
4. Scroll indicators

### Phase 4: Feedback States
1. Loading with metrics
2. Error with guidance
3. Empty states
4. Connection status indicator

### Phase 5: Polish
1. Metrics display bar
2. Animation refinements
3. Edge case handling
4. Documentation

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/theme.ts` | NEW | Centralized theme configuration |
| `src/store/app-store.ts` | MODIFY | Add queryStateCache, sidebarTab |
| `src/store/use-query.ts` | MODIFY | Use app-store cache |
| `src/components/layout/header.tsx` | REWRITE | 2-line with breadcrumb |
| `src/components/layout/footer.tsx` | REWRITE | 2-line, mode-based |
| `src/components/layout/panel.tsx` | MODIFY | Themed borders |
| `src/components/sidebar/sidebar.tsx` | REWRITE | Tab-based structure |
| `src/components/sidebar/sidebar-section.tsx` | MODIFY | New visual treatment |
| `src/components/sidebar/sidebar-tabs.tsx` | NEW | Tab switcher component |
| `src/components/table/data-table.tsx` | MODIFY | Type formatting, selection |
| `src/components/loading.tsx` | MODIFY | Metrics-aware loading |
| `src/components/error-panel.tsx` | NEW | Guided error display |
| `src/views/table-view.tsx` | MODIFY | Metrics bar, mode footer |

---

## Visual Mockup

Final target appearance:

```
╭─────────────────────────────────────────────────────────────────────────────╮
│ ◆ DynoTUI                                            ● default │ us-east-1 │
│ ═ Connect   Browse   Saved                       users › scan (2 filters)  │
├─────────────────────┬───────────────────────────────────────────────────────┤
│ ▾ Profiles        3 │ ╭─ Results ───────────────────────────────────────────│
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ │                                                     │
│   default        ●  │ │ pk           │ sk        │ status  │ count │ data  │
│ ▸ production        │ │──────────────│───────────│─────────│───────│───────│
│   staging           │ │ user_001     │ 2024-01   │ active  │    42 │ {3}   │
│                     │ │▸user_002     │ 2024-02   │ pending │   128 │ {5}   │
│ ▾ Regions        17 │ │ user_003     │ 2024-03   │ ∅       │     0 │ {1}   │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ │                                                 ▼   │
│   us-east-1      ●  │ │                                                     │
│   us-west-2         │ ╰─────────────────────────────────────────────────────│
│                   ▼ │ │ 3/150 │ 2.5 RCU │ 0.8s │              ▸ More (n)  │ │
├─────────────────────┴───────────────────────────────────────────────────────┤
│ default › us-east-1 › users › scan                                          │
│ j/k Navigate  Enter View  s Clear  q Query  f Filter  n Next  r Refresh     │
╰─────────────────────────────────────────────────────────────────────────────╯
```

---

## Success Criteria

1. **Visual**: Looks professional, AWS-aligned, lazygit-quality
2. **Interaction**: All modes have clear footer hints
3. **Architecture**: Unified state, no stale closures
4. **Metrics**: RCU, timing, scan count visible
5. **Errors**: Actionable guidance for common issues
6. **Types**: Proper formatting for DDB types (null, sets, binary)
